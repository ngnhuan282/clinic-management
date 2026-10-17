using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Helpers;
using Microsoft.EntityFrameworkCore;

internal static class DoctorStockReviewChecks
{
    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password,
        int noInvoiceId, int unpaidId, int paidId, int replacementId, Action<bool, string> check)
    {
        async Task<JsonNode> Send(HttpMethod method, string path, object? body = null, int status = 200)
        {
            using var request = new HttpRequestMessage(method, path);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status, $"Doctor review {method} {path}: expected {status}, got {(int)response.StatusCode}"
                + ((int)response.StatusCode == status ? "" : ": " + text));
            return JsonNode.Parse(text)!;
        }
        async Task Login(string username)
        {
            client.DefaultRequestHeaders.Authorization = null;
            var payload = await Send(HttpMethod.Post, "api/auth/login", new { username, password });
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", payload["result"]!["accessToken"]!.GetValue<string>());
        }
        async Task<int> ReviewId(int rxId) => await db.PrescriptionStockReviews.Where(x => x.PrescriptionId == rxId && x.Status == "Pending")
            .Select(x => x.PrescriptionStockReviewId).SingleAsync();
        async Task<JsonNode> Detail(int id) => (await Send(HttpMethod.Get, $"api/stock-reviews/{id}"))["result"]!;
        async Task<JsonNode> PharmacyDetail(int id) => (await Send(HttpMethod.Get, $"api/dispensing/{id}"))["result"]!;
        object Response(JsonNode detail, string action = "AdjustPrescription", int quantity = 10, int? medicineId = null, string reason = "Adjust to available stock") => new
        {
            action, reason, expectedReviewUpdatedAt = detail["review"]!["updatedAt"]!.GetValue<string>(),
            expectedPrescriptionUpdatedAt = detail["prescriptionUpdatedAt"]!.GetValue<string>(), notes = "Stock reviewed",
            details = new[] { new { medicineId = medicineId ?? detail["prescription"]!["details"]![0]!["medicineId"]!.GetValue<int>(), quantity, dosage = "One daily", instructions = "After food" } }
        };
        object Recheck(JsonNode detail) => new
        {
            expectedReviewId = detail["reviews"]![0]!["reviewId"]!.GetValue<int>(),
            expectedReviewUpdatedAt = detail["reviews"]![0]!["updatedAt"]!.GetValue<string>(),
            expectedPrescriptionUpdatedAt = detail["updatedAt"]!.GetValue<string>()
        };
        async Task<JsonNode> CreateReview(int rxId) => (await Send(HttpMethod.Post, $"api/dispensing/{rxId}/stock-reviews", new
        {
            expectedUpdatedAt = (await PharmacyDetail(rxId))["updatedAt"]!.GetValue<string>(), note = "Please review the shortage again"
        }))["result"]!;

        var noInvoiceReview = await ReviewId(noInvoiceId);
        var unpaidReview = await ReviewId(unpaidId);
        await Login("reviewpharmacist");
        await CreateReview(paidId);
        var paidReview = await ReviewId(paidId);
        client.DefaultRequestHeaders.Authorization = null;
        await Send(HttpMethod.Get, "api/stock-reviews", status: 401);
        foreach (var user in new[] { "reviewpharmacist", "reviewpatient", "testreceptionist", "testlab", "testadmin" })
        {
            await Login(user);
            await Send(HttpMethod.Get, "api/stock-reviews", status: 403);
            await Send(HttpMethod.Get, $"api/stock-reviews/{noInvoiceReview}", status: 403);
            await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", new { action = "KeepPrescription", reason = "Not authorized",
                expectedReviewUpdatedAt = DateTime.UtcNow, expectedPrescriptionUpdatedAt = DateTime.UtcNow }, 403);
        }
        db.ChangeTracker.Clear();
        var hash = await db.Users.Where(x => x.Username == "testdoctor").Select(x => x.PasswordHash).SingleAsync();
        var other = new User { Username = "reviewotherdoctor", FullName = "Other doctor", PasswordHash = hash, RoleId = 2, CreatedAt = DateTime.UtcNow };
        db.Users.Add(other);
        await db.SaveChangesAsync();
        var otherDoctor = await db.Doctors.FirstAsync(x => x.DoctorId != 1);
        otherDoctor.UserId = other.UserId;
        await db.SaveChangesAsync();
        await Login("reviewotherdoctor");
        check((await Send(HttpMethod.Get, "api/stock-reviews"))["result"]!["totalItems"]!.GetValue<int>() == 0, "Doctor queue excludes other prescribers' patients");
        await Send(HttpMethod.Get, $"api/stock-reviews/{noInvoiceReview}", status: 403);
        await Login("testdoctor");
        var detail = await Detail(noInvoiceReview);
        await Login("reviewotherdoctor");
        await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", Response(detail), 403);
        await Login("testdoctor");
        check((await Send(HttpMethod.Get, "api/stock-reviews"))["result"]!["totalItems"]!.GetValue<int>() == 3, "Default doctor queue includes the three assigned pending reviews");
        await Send(HttpMethod.Get, "api/stock-reviews?status=Wrong", status: 400);
        await Send(HttpMethod.Get, "api/stock-reviews/2147483647", status: 404);
        var prescribingDoctor = await db.Doctors.SingleAsync(x => x.DoctorId == 1);
        prescribingDoctor.IsActive = false;
        await db.SaveChangesAsync();
        await Send(HttpMethod.Get, "api/stock-reviews", status: 403);
        await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", Response(detail, action: "KeepPrescription"), 403);
        prescribingDoctor.IsActive = true;
        await db.SaveChangesAsync();
        var permission = await db.RolePermissions.SingleAsync(x => x.RoleId == 2 && x.PermissionCode == "pharmacy.prescribe");
        db.RolePermissions.Remove(permission);
        await db.SaveChangesAsync();
        await Send(HttpMethod.Get, "api/stock-reviews", status: 403);
        await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", Response(detail, action: "KeepPrescription"), 403);
        db.RolePermissions.Add(permission);
        await db.SaveChangesAsync();
        check((await Send(HttpMethod.Get, "api/notifications?pageSize=100"))["result"]!["items"]!.AsArray()
            .Any(x => x?["stockReviewId"]?.GetValue<int>() == noInvoiceReview), "Doctor notification carries structured review link");
        check(detail["canRespond"]!.GetValue<bool>() && detail["review"]!["workflowStatus"]!.GetValue<string>() == "PendingDoctor",
            "An unanswered review is the only editable doctor phase");
        await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", Response(detail, reason: "  "), 400);
        await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", Response(detail, quantity: 0), 400);
        await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", Response(detail, medicineId: 2147483647), 404);
        await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", Response(detail, action: "Wrong"), 400);
        var invalidDirections = JsonSerializerNode(Response(detail));
        invalidDirections["details"]![0]!["dosage"] = new string('a', 101);
        await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", invalidDirections, 400);
        var unchanged = new { action = "AdjustPrescription", reason = "No change", notes = detail["prescription"]!["notes"]?.GetValue<string>(),
            details = detail["prescription"]!["details"]!.DeepClone(), expectedReviewUpdatedAt = detail["review"]!["updatedAt"]!.GetValue<string>(),
            expectedPrescriptionUpdatedAt = detail["prescriptionUpdatedAt"]!.GetValue<string>() };
        await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", unchanged, 400);
        var stale = JsonSerializerNode(Response(detail));
        stale["expectedReviewUpdatedAt"] = DateTime.UtcNow.AddDays(-1);
        await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", stale, 409);
        var stalePrescription = JsonSerializerNode(Response(detail));
        stalePrescription["expectedPrescriptionUpdatedAt"] = DateTime.UtcNow.AddDays(-1);
        await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", stalePrescription, 409);
        var baselineDecisions = await db.PrescriptionStockReviewDecisions.CountAsync();
        check(baselineDecisions == 1, "Invalid and stale responses add no audit beyond the completed fixture's Keep");

        var recordId = detail["prescription"]!["medicalRecordId"]!.GetValue<int>();
        var record = await db.MedicalRecords.Include(x => x.Appointment).SingleAsync(x => x.MedicalRecordId == recordId);
        record.PaperBookUpdatedAt = DateTime.UtcNow;
        record.Appointment.Status = "Completed";
        await db.SaveChangesAsync();
        var oldDetailId = detail["prescription"]!["details"]![0]!["prescriptionDetailId"]!.GetValue<int>();
        var stockBefore = await db.Inventory.SumAsync(x => x.QuantityInStock);
        var requestBody = Response(detail);
        detail = (await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", requestBody))["result"]!;
        check(detail["review"]!["decisions"]![0]!["outcome"]!.GetValue<string>() == "Applied"
            && detail["prescription"]!["details"]![0]!["quantity"]!.GetValue<int>() == 10
            && detail["prescription"]!["details"]![0]!["prescriptionDetailId"]!.GetValue<int>() == oldDetailId,
            "Unbilled adjustment applies quantity and retains source detail ID");
        check(!detail["canRespond"]!.GetValue<bool>() && detail["review"]!["decisions"]!.AsArray().Count == 1
            && detail["review"]!["workflowStatus"]!.GetValue<string>() == "WaitingPharmacyRecheck", "First official decision immediately locks the doctor form");
        var afterRecord = await db.MedicalRecords.AsNoTracking().Include(x => x.Appointment).SingleAsync(x => x.MedicalRecordId == recordId);
        check(afterRecord.PaperBookUpdatedAt == null && afterRecord.Appointment.Status == "InProgress", "Clinical adjustment retains paper-book invalidation and visit reopening");
        var notificationCount = await db.Notifications.CountAsync();
        foreach (var rejected in new[] { requestBody, Response(detail, action: "KeepPrescription", reason: "A different reason"),
            Response(detail, quantity: 7), Response(detail, medicineId: replacementId), stale })
            check((await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", rejected, 409))["code"]!.GetValue<int>() == 7413,
                "Any second valid response returns 7413, including a new action, changed prescription or old version");
        var lockedDetail = await Detail(noInvoiceReview);
        check(lockedDetail["review"]!["updatedAt"]!.GetValue<string>() == detail["review"]!["updatedAt"]!.GetValue<string>()
            && await db.PrescriptionStockReviewDecisions.CountAsync() == baselineDecisions + 1
            && await db.Notifications.CountAsync() == notificationCount
            && stockBefore == await db.Inventory.SumAsync(x => x.QuantityInStock), "Rejected responses change neither audit, version, notifications nor stock");
        await Send(HttpMethod.Put, $"api/prescriptions/{noInvoiceId}", new { notes = "Bypass review", details = detail["prescription"]!["details"]!.DeepClone() }, 409);
        await Send(HttpMethod.Patch, $"api/prescriptions/{noInvoiceId}/cancel", status: 409);

        // Simulate another order consuming stock in the isolated test database, not in the live clinic database.
        var originalMedicineId = detail["prescription"]!["details"]![0]!["medicineId"]!.GetValue<int>();
        var currentLot = await db.Inventory.SingleAsync(x => x.MedicineId == originalMedicineId && x.ExpiryDate == ClinicClock.Today);
        currentLot.QuantityInStock = 9;
        await db.SaveChangesAsync();
        await Login("reviewpharmacist");
        var pharmacyDetail = await PharmacyDetail(noInvoiceId);
        var oldRecheckBody = Recheck(pharmacyDetail);
        await Send(HttpMethod.Post, $"api/dispensing/{noInvoiceId}/stock-reviews/recheck", new { expectedReviewId = noInvoiceReview }, 400);
        var staleRecheck = JsonSerializerNode(oldRecheckBody);
        staleRecheck["expectedReviewUpdatedAt"] = DateTime.UtcNow.AddDays(-1);
        await Send(HttpMethod.Post, $"api/dispensing/{noInvoiceId}/stock-reviews/recheck", staleRecheck, 409);
        pharmacyDetail = (await Send(HttpMethod.Post, $"api/dispensing/{noInvoiceId}/stock-reviews/recheck", oldRecheckBody))["result"]!;
        check(pharmacyDetail["reviews"]![0]!["status"]!.GetValue<string>() == "StillShortage"
            && pharmacyDetail["reviews"]![0]!["workflowStatus"]!.GetValue<string>() == "StillShortage"
            && pharmacyDetail["reviews"]![0]!["resolvedAt"] != null
            && pharmacyDetail["canRequestReview"]!.GetValue<bool>() && !pharmacyDetail["canDispense"]!.GetValue<bool>(),
            "Insufficient recheck closes the round with resolver/time, without falsely marking stock sufficient");
        check(await db.PrescriptionStockReviews.CountAsync(x => x.PrescriptionId == noInvoiceId) == 1
            && await db.PrescriptionStockReviews.CountAsync(x => x.PrescriptionId == noInvoiceId && x.Status == "Pending") == 0
            && await db.Inventory.SumAsync(x => x.QuantityInStock) == stockBefore - 3,
            "Still-short recheck creates no automatic request and never deducts inventory");
        await Send(HttpMethod.Post, $"api/dispensing/{noInvoiceId}/stock-reviews/recheck", oldRecheckBody, 409);
        await Send(HttpMethod.Post, $"api/dispensing/{noInvoiceId}/confirm", status: 409);
        var closedShortage = pharmacyDetail["reviews"]![0]!.ToJsonString();
        currentLot.QuantityInStock = 10;
        await db.SaveChangesAsync();
        pharmacyDetail = await PharmacyDetail(noInvoiceId);
        check(pharmacyDetail["hasSufficientStock"]!.GetValue<bool>()
            && pharmacyDetail["workflowStatus"]!.GetValue<string>() == "AwaitingPayment"
            && !pharmacyDetail["canDispense"]!.GetValue<bool>() && !pharmacyDetail["canRequestReview"]!.GetValue<bool>()
            && pharmacyDetail["reviews"]![0]!.ToJsonString() == closedShortage
            && await db.PrescriptionStockReviews.CountAsync(x => x.PrescriptionId == noInvoiceId) == 1,
            "Waiting for replenishment restores current stock eligibility without an automatic doctor round or rewriting the old shortage audit; Unpaid still blocks handover");
        currentLot.QuantityInStock = 9;
        await db.SaveChangesAsync();
        pharmacyDetail = await CreateReview(noInvoiceId);
        var newReview = await ReviewId(noInvoiceId);
        check(newReview != noInvoiceReview && pharmacyDetail["reviews"]!.AsArray().Count == 2
            && pharmacyDetail["reviews"]![0]!["decisions"]!.AsArray().Count == 0
            && pharmacyDetail["reviews"]![0]!["shortages"]![0]!["quantityAvailable"]!.GetValue<int>() == 9
            && pharmacyDetail["reviews"]![1]!["shortages"]![0]!["quantityAvailable"]!.GetValue<int>() == 12,
            "Pharmacist explicitly creates a fresh request while the old shortage snapshot stays intact");
        await Send(HttpMethod.Post, $"api/dispensing/{noInvoiceId}/stock-reviews", new
        {
            expectedUpdatedAt = pharmacyDetail["updatedAt"]!.GetValue<string>(), note = "Duplicate open round"
        }, 409);
        await Send(HttpMethod.Post, $"api/dispensing/{noInvoiceId}/stock-reviews/recheck", oldRecheckBody, 409);
        check(await db.PrescriptionStockReviews.CountAsync(x => x.PrescriptionStockReviewId == newReview && x.Status == "Pending") == 1,
            "An old-tab recheck cannot close a newer round even when the prescription version is unchanged");

        await Login("testdoctor");
        var oldReviewDetail = await Detail(noInvoiceReview);
        check(!oldReviewDetail["canRespond"]!.GetValue<bool>() && oldReviewDetail["review"]!["decisions"]!.AsArray().Count == 1,
            "Closed old request keeps its one official response and remains locked");
        check((await Send(HttpMethod.Get, "api/stock-reviews?status=StillShortage"))["result"]!["totalItems"]!.GetValue<int>() == 1,
            "Doctor can filter completed-but-still-short requests separately");
        detail = await Detail(newReview);
        check(detail["canRespond"]!.GetValue<bool>(), "A new round grants a fresh doctor response, not an edit of the old decision");
        var concurrentBody = Response(detail, quantity: 6, medicineId: replacementId);
        var concurrent = await Task.WhenAll(Enumerable.Range(0, 2).Select(_ => client.PostAsJsonAsync($"api/stock-reviews/{newReview}/responses", concurrentBody)));
        var concurrentResults = await Task.WhenAll(concurrent.Select(async x => $"{(int)x.StatusCode}: {await x.Content.ReadAsStringAsync()}"));
        check(concurrent.Count(x => (int)x.StatusCode == 200) == 1 && concurrent.Count(x => (int)x.StatusCode == 409) == 1,
            "Concurrent first responses commit exactly once: " + string.Join(" | ", concurrentResults.Select(x => x[..Math.Min(x.Length, 120)])));
        foreach (var response in concurrent) response.Dispose();
        detail = await Detail(newReview);
        check(detail["prescription"]!["details"]![0]!["medicineId"]!.GetValue<int>() == replacementId
            && detail["review"]!["decisions"]!.AsArray().Count == 1
            && detail["review"]!["decisions"]![0]!["before"]!["details"]![0]!["quantity"]!.GetValue<int>() == 10
            && detail["review"]!["decisions"]![0]!["after"]!["details"]![0]!["quantity"]!.GetValue<int>() == 6,
            "New round can replace medicines with its own immutable before/after audit");
        await Login("reviewpharmacist");
        pharmacyDetail = await PharmacyDetail(noInvoiceId);
        pharmacyDetail = (await Send(HttpMethod.Post, $"api/dispensing/{noInvoiceId}/stock-reviews/recheck", Recheck(pharmacyDetail)))["result"]!;
        check(pharmacyDetail["reviews"]![0]!["status"]!.GetValue<string>() == "Resolved"
            && pharmacyDetail["reviews"]![0]!["workflowStatus"]!.GetValue<string>() == "Completed"
            && pharmacyDetail["workflowStatus"]!.GetValue<string>() == "AwaitingPayment" && !pharmacyDetail["canDispense"]!.GetValue<bool>(),
            "Enough stock completes review but does not unlock dispensing without a Paid invoice");
        check(pharmacyDetail["reviews"]![1]!.ToJsonString() == closedShortage
            && pharmacyDetail["prescriptionStatus"]!.GetValue<string>() == "Issued"
            && pharmacyDetail["paymentStatus"]!.GetValue<string>() == "Unpaid"
            && !pharmacyDetail["reviews"]!.AsArray().Any(x => x!["status"]!.GetValue<string>() == "Pending"),
            "A sufficient new round preserves the old still-short result, independent of Unpaid payment and Issued prescription state");
        await Send(HttpMethod.Post, $"api/dispensing/{noInvoiceId}/confirm", status: 409);

        await Login("testdoctor");
        foreach (var (id, rxId, status) in new[] { (unpaidReview, unpaidId, "Unpaid"), (paidReview, paidId, "Paid") })
        {
            detail = await Detail(id);
            var invoice = await db.Invoices.AsNoTracking().SingleAsync(x => x.AppointmentId == detail["prescription"]!["appointmentId"]!.GetValue<int>());
            var originalQuantity = detail["prescription"]!["details"]![0]!["quantity"]!.GetValue<int>();
            detail = (await Send(HttpMethod.Post, $"api/stock-reviews/{id}/responses", Response(detail, quantity: 12)))["result"]!;
            var invoiceAfter = await db.Invoices.AsNoTracking().SingleAsync(x => x.Id == invoice.Id);
            check(detail["review"]!["decisions"]![0]!["outcome"]!.GetValue<string>() == "AwaitingBilling"
                && detail["review"]!["workflowStatus"]!.GetValue<string>() == "WaitingBilling" && !detail["canRespond"]!.GetValue<bool>()
                && detail["prescription"]!["details"]![0]!["quantity"]!.GetValue<int>() == originalQuantity
                && invoiceAfter.Status == status && invoiceAfter.TotalAmount == invoice.TotalAmount,
                $"{status} invoice adjustment stays a locked proposal; current Rx and money untouched");
            var auditCount = await db.PrescriptionStockReviewDecisions.CountAsync();
            notificationCount = await db.Notifications.CountAsync();
            foreach (var rejected in new[] { Response(detail, quantity: 12, reason: "Another reason"), Response(detail, quantity: 8),
                Response(detail, action: "KeepPrescription", reason: "Cannot withdraw a submitted decision") })
                check((await Send(HttpMethod.Post, $"api/stock-reviews/{id}/responses", rejected, 409))["code"]!.GetValue<int>() == 7413,
                    $"{status} official proposal cannot be revised, resent or withdrawn in the same round");
            check(await db.PrescriptionStockReviewDecisions.CountAsync() == auditCount && await db.Notifications.CountAsync() == notificationCount,
                $"{status} repeated responses do not add audits or notifications");
            await Login("reviewpharmacist");
            pharmacyDetail = await PharmacyDetail(rxId);
            check((await Send(HttpMethod.Post, $"api/dispensing/{rxId}/stock-reviews/recheck", Recheck(pharmacyDetail), 409))["code"]!.GetValue<int>() == 7411,
                "Pharmacy cannot bypass the real billing handoff");
            await Send(HttpMethod.Post, $"api/dispensing/{rxId}/stock-reviews", new
            {
                expectedUpdatedAt = pharmacyDetail["updatedAt"]!.GetValue<string>(), note = "Cannot start a parallel round"
            }, 409);
            await Send(HttpMethod.Post, $"api/dispensing/{rxId}/confirm", status: 409);
            check(pharmacyDetail["reviews"]![0]!["decisions"]![0]!["reason"] != null,
                "Pharmacy sees doctor reason and proposal without unauthorized clinical edits");
            await Login("testdoctor");
        }
        check(await db.Inventory.SumAsync(x => x.QuantityInStock) == stockBefore - 3, "Doctor responses and pharmacy rechecks never deduct or reserve stock");
        var pharmacyUserId = await db.Users.Where(u => u.Username == "reviewpharmacist").Select(u => u.UserId).SingleAsync();
        check(await db.Notifications.AnyAsync(x => x.EventKey.StartsWith($"stock-review:{noInvoiceReview}:decision:")
            && x.UserId == pharmacyUserId), "Pharmacy receives persistent doctor-response notifications");

        // Legacy requests may contain several decisions; the new policy must not delete that audit history.
        var originalDecision = await db.PrescriptionStockReviewDecisions.AsNoTracking().SingleAsync(x => x.PrescriptionStockReviewId == noInvoiceReview);
        for (var i = 0; i < 3; i++)
            db.PrescriptionStockReviewDecisions.Add(new PrescriptionStockReviewDecision
            {
                PrescriptionStockReviewId = noInvoiceReview, DoctorUserId = originalDecision.DoctorUserId,
                Action = "KeepPrescription", Outcome = "Kept", Reason = "Legacy response " + i,
                BeforeJson = originalDecision.AfterJson, AfterJson = originalDecision.AfterJson, CreatedAt = originalDecision.CreatedAt.AddSeconds(i + 1)
            });
        await db.SaveChangesAsync();
        detail = await Detail(noInvoiceReview);
        check(!detail["canRespond"]!.GetValue<bool>() && detail["review"]!["decisions"]!.AsArray().Count == 4
            && detail["review"]!["workflowStatus"]!.GetValue<string>() == "StillShortage", "Legacy multi-response history remains readable, immutable and locked");
        await Send(HttpMethod.Post, $"api/stock-reviews/{noInvoiceReview}/responses", Response(detail, action: "KeepPrescription"), 409);
        check(await db.PrescriptionStockReviewDecisions.CountAsync(x => x.PrescriptionStockReviewId == noInvoiceReview) == 4,
            "A rejected legacy response does not delete or append audit rows");
    }

    public static async Task RunPartiallyPaidAsync(HttpClient client, ApplicationDbContext db, string password,
        int rxId, Action<bool, string> check, bool keep = false)
    {
        async Task<JsonNode> Send(HttpMethod method, string path, object? body = null, int status = 200)
        {
            using var request = new HttpRequestMessage(method, path);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status, $"Partial payment {method} {path}: expected {status}, got {(int)response.StatusCode}"
                + ((int)response.StatusCode == status ? "" : ": " + text));
            return JsonNode.Parse(text)!;
        }
        async Task Login(string username)
        {
            client.DefaultRequestHeaders.Authorization = null;
            var payload = await Send(HttpMethod.Post, "api/auth/login", new { username, password });
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", payload["result"]!["accessToken"]!.GetValue<string>());
        }
        async Task<string> State()
        {
            var rx = await db.Prescriptions.AsNoTracking().Where(x => x.PrescriptionId == rxId).Select(x => new
            {
                x.Status, x.Notes, x.UpdatedAt, x.DispensedAt, x.DispensedByUserId,
                Details = x.Details.OrderBy(d => d.PrescriptionDetailId).Select(d => new
                    { d.PrescriptionDetailId, d.MedicineId, d.Quantity, d.Dosage, d.Instructions }),
                Record = new { x.MedicalRecord.Symptoms, x.MedicalRecord.Conclusion, x.MedicalRecord.PaperBookUpdatedAt,
                    x.MedicalRecord.UpdatedAt, x.MedicalRecord.Appointment.Status }
            }).SingleAsync();
            var invoices = await db.Invoices.AsNoTracking().OrderBy(x => x.Id).Select(x => new
            {
                x.Id, x.AppointmentId, x.PatientId, x.CashierId, x.Status, x.BillingStage, x.CreatedAt,
                x.TotalAmount, x.InsuranceDiscountPercent, x.InsuranceAmount, x.PatientAmount, x.PaymentMethod,
                Details = x.InvoiceDetails.OrderBy(d => d.Id).Select(d => new
                    { d.Id, d.SourceType, d.SourceId, d.ItemName, d.UnitPrice, d.Quantity, d.TotalPrice })
            }).ToListAsync();
            return System.Text.Json.JsonSerializer.Serialize(new
            {
                rx, invoices, stock = await db.Inventory.SumAsync(x => x.QuantityInStock),
                dispenses = await db.DispenseDetails.CountAsync()
            });
        }

        await Login("reviewpharmacist");
        var pharmacy = (await Send(HttpMethod.Get, $"api/dispensing/{rxId}"))["result"]!;
        check(pharmacy["invoiceId"] != null && pharmacy["paymentStatus"]!.GetValue<string>() == "PartiallyPaid",
            "PartiallyPaid invoice remains visible instead of being treated as missing or Unpaid");
        var medicineId = pharmacy["medicines"]![0]!["medicineId"]!.GetValue<int>();
        var lot = await db.Inventory.SingleAsync(x => x.MedicineId == medicineId && x.ExpiryDate == ClinicClock.Today);
        var originalStock = lot.QuantityInStock;
        lot.QuantityInStock = 20;
        await db.SaveChangesAsync();
        pharmacy = (await Send(HttpMethod.Get, $"api/dispensing/{rxId}"))["result"]!;
        check(pharmacy["hasSufficientStock"]!.GetValue<bool>() && !pharmacy["canDispense"]!.GetValue<bool>()
            && pharmacy["workflowStatus"]!.GetValue<string>() == "AwaitingPayment",
            "Enough stock and PartiallyPaid still cannot authorize dispensing");
        var ready = (await Send(HttpMethod.Get, "api/dispensing?workflowStatus=Ready&pageSize=100"))["result"]!["items"]!.AsArray();
        check(!ready.Any(x => x!["prescriptionId"]!.GetValue<int>() == rxId), "PartiallyPaid prescription never appears as Ready");
        var waiting = (await Send(HttpMethod.Get, "api/dispensing?workflowStatus=AwaitingPayment&pageSize=100"))["result"]!["items"]!.AsArray();
        check(waiting.Any(x => x!["prescriptionId"]!.GetValue<int>() == rxId
            && x["invoiceId"] != null && x["paymentStatus"]!.GetValue<string>() == "PartiallyPaid"),
            "Queue preserves the PartiallyPaid invoice while awaiting full payment");
        foreach (var path in new[] { "api/dispensing?paymentStatus=Unpaid&pageSize=100",
            "api/dispensing?workflowStatus=AwaitingPayment&paymentStatus=Unpaid&pageSize=100" })
        {
            var unpaid = (await Send(HttpMethod.Get, path))["result"]!["items"]!.AsArray();
            check(unpaid.Any(x => x!["prescriptionId"]!.GetValue<int>() == rxId)
                && unpaid.All(x => x!["paymentStatus"]!.GetValue<string>() != "Paid"),
                "Unpaid filter includes partial payment without returning Paid prescriptions");
        }
        var inconsistentFilter = (await Send(HttpMethod.Get,
            "api/dispensing?workflowStatus=AwaitingPayment&paymentStatus=Paid&pageSize=100"))["result"]!;
        check(inconsistentFilter["items"]!.AsArray().Count == 0 && inconsistentFilter["totalItems"]!.GetValue<int>() == 0,
            "Contradictory workflow/payment filters safely return an empty page");
        check((await Send(HttpMethod.Post, $"api/dispensing/{rxId}/confirm", status: 409))["code"]!.GetValue<int>() == 7404,
            "Actual handover rejects partial payment even with sufficient stock and no open review");
        lot.QuantityInStock = originalStock;
        await db.SaveChangesAsync();
        var beforeState = await State();
        var adjusted = new { notes = "Proposed reviewed change", details = new[]
            { new { medicineId, quantity = 12, dosage = "One daily", instructions = "After food" } } };
        await Login("testdoctor");
        check((await Send(HttpMethod.Put, $"api/prescriptions/{rxId}", adjusted, 409))["code"]!.GetValue<int>() == 7407,
            "Ordinary prescription edits cannot bypass a PartiallyPaid invoice without an open review");
        check((await Send(HttpMethod.Patch, $"api/prescriptions/{rxId}/cancel", status: 409))["code"]!.GetValue<int>() == 7407,
            "Ordinary cancellation cannot bypass a PartiallyPaid invoice without an open review");
        check(await State() == beforeState, "Rejected partial-payment edits and cancellation leave clinical data, all invoice money and stock intact");

        await Login("reviewpharmacist");
        pharmacy = (await Send(HttpMethod.Post, $"api/dispensing/{rxId}/stock-reviews", new
        {
            expectedUpdatedAt = pharmacy["updatedAt"]!.GetValue<string>(), note = "Please review this partially paid prescription"
        }))["result"]!;
        var reviewId = pharmacy["reviews"]![0]!["reviewId"]!.GetValue<int>();
        check(pharmacy["reviews"]![0]!["paymentStatus"]!.GetValue<string>() == "PartiallyPaid"
            && pharmacy["reviews"]![0]!["invoiceId"]!.GetValue<int>() == pharmacy["invoiceId"]!.GetValue<int>(),
            "Review snapshot retains the actual partially paid invoice and payment status");
        var pendingUnpaid = (await Send(HttpMethod.Get,
            "api/dispensing?workflowStatus=NeedsReview&paymentStatus=Unpaid&reviewStatus=Pending&pageSize=100"))["result"]!["items"]!.AsArray();
        check(pendingUnpaid.Any(x => x!["prescriptionId"]!.GetValue<int>() == rxId)
            && pendingUnpaid.All(x => x!["paymentStatus"]!.GetValue<string>() != "Paid"),
            "Combined shortage/payment/review filters preserve partially paid pending requests");
        await Login("testdoctor");
        var detail = (await Send(HttpMethod.Get, $"api/stock-reviews/{reviewId}"))["result"]!;
        check(detail["hasMedicineInvoice"]!.GetValue<bool>(), "Doctor guard recognizes the related PartiallyPaid Medicine/Final invoice");
        var responseBody = new
        {
            action = keep ? "KeepPrescription" : "AdjustPrescription", reason = "One official partial-payment review response",
            expectedReviewUpdatedAt = detail["review"]!["updatedAt"]!.GetValue<string>(),
            expectedPrescriptionUpdatedAt = detail["prescriptionUpdatedAt"]!.GetValue<string>(),
            adjusted.notes, adjusted.details
        };
        detail = (await Send(HttpMethod.Post, $"api/stock-reviews/{reviewId}/responses", responseBody))["result"]!;
        check(!detail["canRespond"]!.GetValue<bool>()
            && detail["review"]!["workflowStatus"]!.GetValue<string>() == (keep ? "WaitingPharmacyRecheck" : "WaitingBilling")
            && detail["review"]!["decisions"]![0]!["outcome"]!.GetValue<string>() == (keep ? "Kept" : "AwaitingBilling")
            && detail["prescription"]!["details"]![0]!["quantity"]!.GetValue<int>() == 20,
            keep ? "Keep skips financial reconciliation but does not change the partially paid prescription"
                : "PartiallyPaid adjustment is a locked proposal, never an immediate clinical change");
        check(detail["review"]!["decisions"]![0]!["before"]!["details"]![0]!["quantity"]!.GetValue<int>() == 20
            && detail["review"]!["decisions"]![0]!["after"]!["details"]![0]!["quantity"]!.GetValue<int>() == (keep ? 20 : 12),
            "Partial-payment response preserves immutable Before/After audit snapshots");
        check((await Send(HttpMethod.Post, $"api/stock-reviews/{reviewId}/responses", responseBody, 409))["code"]!.GetValue<int>() == 7413,
            "Partial-payment response cannot be sent twice");
        await Login("reviewpharmacist");
        pharmacy = (await Send(HttpMethod.Get, $"api/dispensing/{rxId}"))["result"]!;
        var recheck = new
        {
            expectedReviewId = reviewId, expectedReviewUpdatedAt = pharmacy["reviews"]![0]!["updatedAt"]!.GetValue<string>(),
            expectedPrescriptionUpdatedAt = pharmacy["updatedAt"]!.GetValue<string>()
        };
        if (keep)
            check((await Send(HttpMethod.Post, $"api/dispensing/{rxId}/stock-reviews/recheck", recheck))["result"]!["reviews"]![0]!["status"]!.GetValue<string>() == "StillShortage",
                "Keep with partial payment permits a pharmacy recheck without falsely approving stock or payment");
        else
            check((await Send(HttpMethod.Post, $"api/dispensing/{rxId}/stock-reviews/recheck", recheck, 409))["code"]!.GetValue<int>() == 7411,
                "Pharmacy cannot bypass billing reconciliation for a PartiallyPaid proposal");
        await Send(HttpMethod.Post, $"api/dispensing/{rxId}/confirm", status: 409);
        check(await State() == beforeState, "Partial-payment review never rewrites the current Rx, paper-book confirmation, invoice money or inventory");
    }

    private static JsonNode JsonSerializerNode(object value) => System.Text.Json.JsonSerializer.SerializeToNode(value)!;
}

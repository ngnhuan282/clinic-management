using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Helpers;
using Microsoft.EntityFrameworkCore;

internal static class StockReviewChecks
{
    public static async Task<(int PaidId, int UnpaidId, int ReadyId, int UnbilledId)> RunAsync(
        HttpClient client, ApplicationDbContext db, string password, Action<bool, string> check, bool verifyDoctor = false)
    {
        var hash = (await db.Users.SingleAsync(x => x.Username == "testadmin")).PasswordHash;
        db.Users.AddRange(
            new User { Username = "reviewpharmacist", FullName = "D7 Pharmacist", RoleId = 7, PasswordHash = hash, CreatedAt = DateTime.UtcNow },
            new User { Username = "reviewpatient", FullName = "D7 Patient", RoleId = 4, PasswordHash = hash, CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();
        var cashier = await db.Users.SingleAsync(x => x.Username == "testreceptionist");
        var doctorUser = await db.Users.SingleAsync(x => x.Username == "testdoctor");
        var category = await db.MedicineCategories.FirstAsync();
        var supplier = await db.Suppliers.FirstAsync();
        var today = ClinicClock.Today;
        var number = 0;
        async Task<Prescription> Fixture(string name, int quantity, string? payment,
            string billingStage = "Medicine", string sourceType = "PrescriptionDetail")
        {
            number++;
            var medicine = new Medicine { MedicineName = name, CategoryId = category.CategoryId,
                SupplierId = supplier.SupplierId, Unit = "Viên", UnitPrice = 1000m };
            var appointment = new Appointment { DoctorId = 1, PatientName = "D7 " + name, PatientPhone = "090077000" + number,
                AppointmentDate = today.ToDateTime(TimeOnly.MinValue), StartTime = TimeSpan.FromHours(number),
                EndTime = TimeSpan.FromHours(number + 0.5), Reason = "Stock review test", Status = "Completed", CreatedAt = DateTime.UtcNow };
            var record = new MedicalRecord { Appointment = appointment, DoctorId = 1, ExaminationDate = DateTime.UtcNow,
                Symptoms = "Test symptoms", Conclusion = "Test conclusion", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            var rx = new Prescription { MedicalRecord = record, Status = "Issued", PrescriptionDate = today.ToDateTime(new TimeOnly(number, 0)),
                CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
                Details = [new PrescriptionDetail { Medicine = medicine, Quantity = quantity, Dosage = "Theo đơn", Instructions = "Theo chỉ định" }] };
            db.Prescriptions.Add(rx);
            db.Inventory.AddRange(new Inventory { Medicine = medicine, BatchNumber = "EXPIRED-" + number, QuantityInStock = 999, ExpiryDate = today.AddDays(-1) },
                new Inventory { Medicine = medicine, BatchNumber = "CURRENT-" + number, QuantityInStock = 12, ExpiryDate = today });
            await db.SaveChangesAsync();
            if (payment != null)
            {
                db.Invoices.Add(new Invoice { AppointmentId = appointment.AppointmentId, PatientId = 0, CashierId = cashier.UserId,
                    Status = payment, BillingStage = billingStage, TotalAmount = quantity * 1000m, PatientAmount = quantity * 1000m,
                    InvoiceDetails = [new InvoiceDetail { SourceType = sourceType,
                        SourceId = sourceType == "Prescription" ? rx.PrescriptionId : rx.Details.Single().PrescriptionDetailId,
                        ItemName = medicine.MedicineName, UnitPrice = 1000m, Quantity = quantity, TotalPrice = quantity * 1000m }] });
                await db.SaveChangesAsync();
            }
            return rx;
        }
        var paid = await Fixture("Review Amlodipine 5mg", 20, "Paid");
        var unpaid = await Fixture("Review Paracetamol 500mg", 20, "Unpaid");
        var ready = await Fixture("Review Vitamin C", 5, "Paid");
        var noInvoice = await Fixture("Review Amoxicillin 500mg", 20, null);
        async Task<JsonNode> Send(HttpMethod method, string path, object? body = null, int status = 200)
        {
            using var request = new HttpRequestMessage(method, path);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status, $"D7 review {method} {path}: expected {status}, got {(int)response.StatusCode}: "
                + ((int)response.StatusCode == status ? "OK" : text));
            return JsonNode.Parse(text)!;
        }
        async Task Login(string username)
        {
            client.DefaultRequestHeaders.Authorization = null;
            var payload = await Send(HttpMethod.Post, "api/auth/login", new { username, password });
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", payload["result"]!["accessToken"]!.GetValue<string>());
        }
        string Path(int id) => $"api/dispensing/{id}";
        async Task<JsonNode> Detail(int id) => (await Send(HttpMethod.Get, Path(id)))["result"]!;
        object Recheck(JsonNode value) => new
        {
            expectedReviewId = value["reviews"]![0]!["reviewId"]!.GetValue<int>(),
            expectedReviewUpdatedAt = value["reviews"]![0]!["updatedAt"]!.GetValue<string>(),
            expectedPrescriptionUpdatedAt = value["updatedAt"]!.GetValue<string>()
        };
        async Task<object> Request(int id, bool notifyBilling = true, string? note = null) => new
        {
            expectedUpdatedAt = (await Detail(id))["updatedAt"]!.GetValue<string>(),
            notifyBilling, note = note ?? "Đề nghị đối chiếu số lượng và phối hợp xử lý thuốc thiếu."
        };
        await Send(HttpMethod.Get, "api/dispensing", status: 401);
        foreach (var username in new[] { "testdoctor", "testreceptionist", "reviewpatient", "testlab" })
        {
            await Login(username);
            await Send(HttpMethod.Get, Path(paid.PrescriptionId), status: 403);
            await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews", new { note = "unauthorized" }, 403);
            await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews/recheck", status: 403);
        }
        await Login("reviewpharmacist");
        var detail = await Detail(paid.PrescriptionId);
        check(detail["workflowStatus"]!.GetValue<string>() == "NeedsReview" && !detail["canDispense"]!.GetValue<bool>()
            && detail["medicines"]![0]!["quantityAvailable"]!.GetValue<int>() == 12, "D7 Paid shortage excludes expired stock but includes expiry today");
        var reviewQueue = (await Send(HttpMethod.Get, "api/dispensing?workflowStatus=NeedsReview&pageSize=100"))["result"]!;
        check(reviewQueue["totalItems"]!.GetValue<int>() == 3, "D7 both paid and unpaid shortages appear in review queue");
        var readyQueue = (await Send(HttpMethod.Get, "api/dispensing?workflowStatus=Ready"))["result"]!;
        check(readyQueue["totalItems"]!.GetValue<int>() == 1, "D7 Ready excludes paid shortage");
        check((await Send(HttpMethod.Get, "api/dispensing?workflowStatus=NeedsReview&paymentStatus=Paid"))["result"]!["totalItems"]!.GetValue<int>() == 1,
            "D7 review payment filter uses real invoice state");
        await Send(HttpMethod.Get, "api/dispensing?reviewStatus=Wrong", status: 400);
        await Send(HttpMethod.Get, "api/dispensing?workflowStatus=Wrong", status: 400);
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews", new { note = "missing version" }, 400);
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews", new { note = "   ", expectedUpdatedAt = detail["updatedAt"]!.GetValue<string>() }, 400);
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews", new { note = "stale version", expectedUpdatedAt = DateTime.UtcNow.AddDays(-1) }, 409);
        await Send(HttpMethod.Post, Path(ready.PrescriptionId) + "/stock-reviews", await Request(ready.PrescriptionId), 409);
        doctorUser.Status = false;
        await db.SaveChangesAsync();
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews", await Request(paid.PrescriptionId), 409);
        doctorUser.Status = true;
        await db.SaveChangesAsync();
        var stockBefore = await db.Inventory.SumAsync(x => x.QuantityInStock);
        var invoiceBefore = await db.Invoices.AsNoTracking().SingleAsync(x => x.AppointmentId == paid.MedicalRecord.AppointmentId);
        var sendRequest = await Request(paid.PrescriptionId, false, new string('a', 2000));
        detail = (await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews", sendRequest))["result"]!;
        check(detail["reviewStatus"]!.GetValue<string>() == "Pending" && !detail["canRequestReview"]!.GetValue<bool>(), "D7 sent review persists pending state");
        check(detail["reviews"]![0]!["recipients"]!.AsArray().Count == 2, "D7 existing invoice forces billing recipient even when client opts out");
        var reviewId = detail["reviews"]![0]!["reviewId"]!.GetValue<int>();
        var notifications = await db.Notifications.AsNoTracking().Where(x => x.EventKey == $"stock-review:{reviewId}:created").ToListAsync();
        check(notifications.Count == 2 && notifications.All(x => x.Content.Length <= 500), "D7 doctor and assigned cashier get durable notifications without overflow");
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews", sendRequest, 409);
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/confirm", status: 409);
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews/recheck", new { expectedReviewId = reviewId }, 400);
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews/recheck", Recheck(detail), 409);
        var invoiceAfter = await db.Invoices.AsNoTracking().SingleAsync(x => x.Id == invoiceBefore.Id);
        check(stockBefore == await db.Inventory.SumAsync(x => x.QuantityInStock)
            && invoiceBefore.TotalAmount == invoiceAfter.TotalAmount && invoiceAfter.Status == "Paid"
            && await db.DispenseDetails.CountAsync() == 0, "D7 request and failed recheck never alter stock, payments or dispensing");
        check((await Send(HttpMethod.Get, "api/dispensing?reviewStatus=Pending"))["result"]!["totalItems"]!.GetValue<int>() == 1,
            "D7 pending review filter matches persisted requests");
        var current = await db.Inventory.SingleAsync(x => x.MedicineId == paid.Details.Single().MedicineId && x.ExpiryDate == today);
        current.QuantityInStock = 20;
        await db.SaveChangesAsync();
        detail = await Detail(paid.PrescriptionId);
        check(detail["hasSufficientStock"]!.GetValue<bool>() && !detail["canDispense"]!.GetValue<bool>(), "D7 replenishment still requires explicit recheck of pending request");
        check(detail["reviews"]![0]!["shortages"]![0]!["quantityAvailable"]!.GetValue<int>() == 12, "D7 shortage snapshot remains unchanged after replenishment");
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews/recheck", Recheck(detail), 409);
        await Login("testdoctor");
        var doctorDetail = (await Send(HttpMethod.Get, $"api/stock-reviews/{reviewId}"))["result"]!;
        doctorDetail = (await Send(HttpMethod.Post, $"api/stock-reviews/{reviewId}/responses", new
        {
            action = "KeepPrescription", reason = "Giữ phác đồ, chờ bổ sung kho",
            expectedReviewUpdatedAt = doctorDetail["review"]!["updatedAt"]!.GetValue<string>(),
            expectedPrescriptionUpdatedAt = doctorDetail["prescriptionUpdatedAt"]!.GetValue<string>()
        }))["result"]!;
        check(!doctorDetail["canRespond"]!.GetValue<bool>()
            && doctorDetail["review"]!["workflowStatus"]!.GetValue<string>() == "WaitingPharmacyRecheck",
            "D7 Keep with a Paid invoice locks the doctor form and needs no billing reconciliation");
        await Login("reviewpharmacist");
        detail = await Detail(paid.PrescriptionId);
        var recheckBody = Recheck(detail);
        detail = (await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews/recheck", recheckBody))["result"]!;
        check(detail["canDispense"]!.GetValue<bool>() && detail["reviewStatus"]!.GetValue<string>() == "Resolved"
            && detail["reviews"]![0]!["resolvedAt"] != null, "D7 recheck logs resolver/time and restores eligibility without handing over medicine");
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews/recheck", recheckBody, 409);
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/confirm");
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/confirm", status: 400);
        check(await db.Inventory.AsNoTracking().Where(x => x.InventoryId == current.InventoryId).Select(x => x.QuantityInStock).SingleAsync() == 0
            && await db.Inventory.Where(x => x.MedicineId == current.MedicineId && x.ExpiryDate < today).Select(x => x.QuantityInStock).SingleAsync() == 999,
            "D7 actual dispense deducts valid lot once and never expired lot");
        await Send(HttpMethod.Post, Path(paid.PrescriptionId) + "/stock-reviews", sendRequest, 400);
        var concurrentRequest = await Request(unpaid.PrescriptionId);
        var concurrent = await Task.WhenAll(Enumerable.Range(0, 2).Select(_ => client.PostAsJsonAsync(Path(unpaid.PrescriptionId) + "/stock-reviews", concurrentRequest)));
        var concurrentResults = await Task.WhenAll(concurrent.Select(async x => $"{(int)x.StatusCode}: {await x.Content.ReadAsStringAsync()}"));
        var uniqueRequest = concurrent.Count(x => (int)x.StatusCode == 200) == 1 && concurrent.Count(x => (int)x.StatusCode == 409) == 1;
        check(uniqueRequest, "D7 concurrent requests produce exactly one pending review"
            + (uniqueRequest ? "" : ": " + string.Join(" | ", concurrentResults)));
        foreach (var response in concurrent) response.Dispose();
        var noInvoiceDetail = await Detail(noInvoice.PrescriptionId);
        var billingRecipientIds = noInvoiceDetail["reviewRecipients"]!.AsArray()
            .Where(x => x!["department"]!.GetValue<string>() == "Billing")
            .Select(x => x!["userId"]!.GetValue<int>()).ToArray();
        var billingUsers = await db.Users.Where(x => billingRecipientIds.Contains(x.UserId)).ToListAsync();
        foreach (var user in billingUsers) user.Status = false;
        await db.SaveChangesAsync();
        await Send(HttpMethod.Post, Path(noInvoice.PrescriptionId) + "/stock-reviews", await Request(noInvoice.PrescriptionId, false), 409);
        foreach (var user in billingUsers) user.Status = true;
        await db.SaveChangesAsync();
        await Send(HttpMethod.Post, Path(noInvoice.PrescriptionId) + "/stock-reviews", await Request(noInvoice.PrescriptionId, false));
        detail = await Detail(noInvoice.PrescriptionId);
        var automaticRecipients = detail["reviews"]![0]!["recipients"]!.AsArray();
        check(automaticRecipients.Count == noInvoiceDetail["reviewRecipients"]!.AsArray().Count
            && automaticRecipients.Any(x => x!["department"]!.GetValue<string>() == "Doctor")
            && automaticRecipients.Any(x => x!["department"]!.GetValue<string>() == "Billing"),
            "D7 no-invoice request automatically includes doctor and eligible billing users despite legacy opt-out");
        var noInvoiceReviewId = detail["reviews"]![0]!["reviewId"]!.GetValue<int>();
        check(await db.Notifications.CountAsync(x => x.EventKey == $"stock-review:{noInvoiceReviewId}:created") == automaticRecipients.Count,
            "D7 automatic recipients each receive a persistent notification without changing invoice state");
        await Login("testdoctor");
        check((await Send(HttpMethod.Get, "api/notifications"))["result"]!["items"]!.AsArray().Any(x => x!["type"]!.GetValue<string>() == "Pharmacy"),
            "D7 doctor receives review in existing notification history");
        await Login("testadmin");
        await Send(HttpMethod.Get, Path(unpaid.PrescriptionId));
        await Login("testreceptionist");
        check((await Send(HttpMethod.Get, "api/notifications"))["result"]!["items"]!.AsArray().Any(x => x!["type"]!.GetValue<string>() == "Pharmacy"),
            "D7 finance receives automatic review notifications in its existing inbox");

        // Separate untouched fixtures support browser tests without rewinding audit history.
        var uiPaid = await Fixture("UI Amlodipine 5mg", 20, "Paid");
        var uiUnpaid = await Fixture("UI Paracetamol 500mg", 20, "Unpaid");
        if (verifyDoctor)
        {
            await DoctorStockReviewChecks.RunAsync(client, db, password, noInvoice.PrescriptionId, unpaid.PrescriptionId,
                uiPaid.PrescriptionId, ready.Details.Single().MedicineId, check);
            foreach (var stage in new[] { "Medicine", "Final" })
                foreach (var source in new[] { "Prescription", "PrescriptionDetail" })
                {
                    var partial = await Fixture($"Partial {stage} {source}", 20, "PartiallyPaid", stage, source);
                    await DoctorStockReviewChecks.RunPartiallyPaidAsync(client, db, password, partial.PrescriptionId, check);
                }
            var keepPartial = await Fixture("Keep partially paid prescription", 20, "PartiallyPaid");
            await DoctorStockReviewChecks.RunPartiallyPaidAsync(client, db, password, keepPartial.PrescriptionId, check, keep: true);
        }
        var uiUnbilled = verifyDoctor ? await Fixture("UI Unbilled Amoxicillin 500mg", 20, null) : null;
        return (uiPaid.PrescriptionId, uiUnpaid.PrescriptionId, ready.PrescriptionId, uiUnbilled?.PrescriptionId ?? 0);
    }
}

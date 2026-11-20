using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Helpers;
using Microsoft.EntityFrameworkCore;

internal static class PostMergeChecks
{
    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password, Action<bool, string> check)
    {
        async Task<JsonNode> Send(HttpMethod method, string path, object? body = null, int status = 200)
        {
            using var request = new HttpRequestMessage(method, path);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status,
                $"Post-merge {method} {path}: expected {status}, got {(int)response.StatusCode}"
                + ((int)response.StatusCode == status ? "" : $": {text}"));
            var data = string.IsNullOrWhiteSpace(text) ? new JsonObject() : JsonNode.Parse(text)!;
            return data is JsonObject obj && obj.ContainsKey("code") && obj.ContainsKey("result")
                ? data["result"] ?? data : data;
        }
        async Task Login(string username)
        {
            client.DefaultRequestHeaders.Authorization = null;
            var session = await Send(HttpMethod.Post, "api/auth/login", new { username, password });
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session["accessToken"]!.GetValue<string>());
        }
        object Item(string type, int id) => new { sourceType = type, sourceId = id, itemName = "Tampered price", unitPrice = 1m, quantity = 999 };
        object InvoiceBody(Appointment visit, string stage, object[] items, decimal? initial = 0) => new
        {
            appointmentId = visit.AppointmentId, patientId = visit.PatientId ?? visit.PatientProfileId,
            billingStage = stage, paymentMethod = "Cash", initialPaymentAmount = initial, items
        };

        var hash = await db.Users.Where(u => u.Username == "testadmin").Select(u => u.PasswordHash).SingleAsync();
        var patientRole = await db.Roles.Where(r => r.RoleName == RoleConstants.Patient).Select(r => r.RoleId).SingleAsync();
        var user = new User { Username = "mergepatient", FullName = "Merge patient", PasswordHash = hash, RoleId = patientRole };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        var profile = new Patient { UserId = user.UserId, FullName = user.FullName, Phone = "0901234091" };
        db.Patients.Add(profile);
        await db.SaveChangesAsync();
        var now = DateTime.UtcNow;
        var book = new PatientBook { PatientId = profile.PatientId, BookNumber = "MERGE-WEB", Status = "Issued", IssuedAt = now };
        db.PatientBooks.Add(book);
        await db.SaveChangesAsync();
        Appointment Visit(int doctorId, int day, Patient patient) => new()
        {
            DoctorId = doctorId, PatientId = patient.UserId, PatientProfileId = patient.PatientId,
            PatientName = patient.FullName, PatientPhone = patient.Phone,
            AppointmentDate = ClinicClock.Today.AddDays(day).ToDateTime(TimeOnly.MinValue),
            StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(8.5),
            Status = "InProgress", CheckedInAt = now, BookVerifiedAt = now, CreatedAt = now, PatientBookId = book.PatientBookId
        };
        var visit = Visit(1, -4, profile);
        var nearerVisit = Visit(1, 0, profile);
        var otherDoctorVisit = Visit(2, 0, profile);
        db.Appointments.AddRange(visit, nearerVisit, otherDoctorVisit);
        await db.SaveChangesAsync();
        var settings = await db.ClinicSettings.SingleAsync();
        settings.DefaultExaminationFee = 187000m;
        settings.PatientBookFee = 17000m;
        await db.SaveChangesAsync();
        var labType = new LabTestType { Name = "Post-merge lab", Price = 100000m };
        db.LabTestTypes.Add(labType);
        await db.SaveChangesAsync();
        var typeId = labType.Id;
        var labPrice = await db.LabTestTypes.Where(t => t.Id == typeId).Select(t => t.Price).SingleAsync();

        await Login("testdoctor");
        var order = await Send(HttpMethod.Post, "api/LabTests", new { appointmentId = visit.AppointmentId, labTestTypeId = typeId });
        var labId = order["id"]!.GetValue<int>();
        check(order["appointmentId"]!.GetValue<int>() == visit.AppointmentId, "Lab order preserves its explicitly selected visit");
        await Send(HttpMethod.Post, "api/LabTests", new { appointmentId = otherDoctorVisit.AppointmentId, labTestTypeId = typeId }, 403);
        await Send(HttpMethod.Post, "api/LabTests", new { patientId = user.UserId, labTestTypeId = typeId });
        check(true, "Legacy patient lookup translates its date-distance query to SQL");

        await Login("testlab");
        var pending = await Send(HttpMethod.Get, "api/LabTests/pending");
        check(!pending.AsArray().Any(t => t!["id"]!.GetValue<int>() == labId), "Unpaid tests do not enter the technician queue");
        await Send(HttpMethod.Post, $"api/LabTests/{labId}/start", status: 409);
        await Send(HttpMethod.Post, "api/LabTests/results", new { labTestId = labId, resultSummary = "Unpaid result" }, 409);

        await Login("testadmin");
        var queue = await Send(HttpMethod.Get, "api/invoices/pending?stage=LabAndConsultation");
        var queued = queue.AsArray().Single(t => t!["appointmentId"]!.GetValue<int>() == visit.AppointmentId)!;
        check(queued["items"]!.AsArray().Any(i => i!["sourceType"]!.GetValue<string>() == "LabTest" && i["sourceId"]!.GetValue<int>() == labId),
            "Billing uses the stored lab visit instead of the nearer appointment");
        check(queued["items"]!.AsArray().Single(i => i!["sourceType"]!.GetValue<string>() == "Appointment")!["unitPrice"]!.GetValue<decimal>() == 187000m,
            "Billing queue uses the configured examination fee");
        var invalidDuplicate = new[] { Item("Appointment", visit.AppointmentId), Item("Appointment", visit.AppointmentId) };
        await Send(HttpMethod.Post, "api/invoices", InvoiceBody(visit, "Pending", invalidDuplicate), 400);
        await Send(HttpMethod.Post, "api/invoices", InvoiceBody(nearerVisit, "LabAndConsultation", [Item("LabTest", labId)]), 400);
        await Send(HttpMethod.Post, "api/invoices", InvoiceBody(visit, "Medicine", [Item("LabTest", labId)]), 400);
        var invoice = await Send(HttpMethod.Post, "api/invoices", InvoiceBody(visit, "LabAndConsultation",
            [Item("Appointment", visit.AppointmentId), Item("LabTest", labId)]));
        var invoiceId = invoice["id"]!.GetValue<int>();
        var total = 187000m + labPrice;
        check(invoice["totalAmount"]!.GetValue<decimal>() == total && invoice["status"]!.GetValue<string>() == "Unpaid",
            "Invoice rebuilds prices and quantities on the server and supports no initial payment");
        invoice = await Send(HttpMethod.Post, $"api/invoices/{invoiceId}/payments", new { amount = 50000m, paymentMethod = "Cash" });
        check(invoice["status"]!.GetValue<string>() == "PartiallyPaid" && invoice["remainingAmount"]!.GetValue<decimal>() == total - 50000m,
            "Partial payment persists a receipt and the remaining balance");
        await Login("testlab");
        await Send(HttpMethod.Post, $"api/LabTests/{labId}/start", status: 409);
        await Login("testadmin");
        invoice = await Send(HttpMethod.Post, $"api/invoices/{invoiceId}/payments", new { amount = total - 50000m, paymentMethod = "Transfer", referenceCode = "MERGE-TEST" });
        check(invoice["status"]!.GetValue<string>() == "Paid" && invoice["payments"]!.AsArray().Count == 2
            && invoice["payments"]!.AsArray().All(p => p!["cashierId"]!.GetValue<int>() > 0 && p["paidAt"] != null),
            "Full settlement records both receipts with cashier and timestamp on a migrated database");
        await Send(HttpMethod.Post, $"api/invoices/{invoiceId}/payments", new { amount = 1m, paymentMethod = "Cash" }, 400);
        await Send(HttpMethod.Post, "api/invoices", InvoiceBody(visit, "LabAndConsultation", [Item("LabTest", labId)]), 400);
        await Login("testlab");
        await Send(HttpMethod.Post, $"api/LabTests/{labId}/start");
        pending = await Send(HttpMethod.Get, "api/LabTests/pending");
        check(pending.AsArray().Any(t => t!["id"]!.GetValue<int>() == labId && t["status"]!.GetValue<string>() == "InProgress"),
            "An in-progress paid test stays in the queue after reload");
        await Send(HttpMethod.Post, "api/LabTests/results", new { labTestId = labId, resultSummary = "Completed paid result" });
        await Login("mergepatient");
        await Send(HttpMethod.Get, $"api/LabTests/{labId}");

        // Deliberately collide a walk-in profile ID with a real patient's account ID.
        var collision = new Patient { PatientId = user.UserId, FullName = "Unlinked walk-in", Phone = "0901234092" };
        await db.Database.OpenConnectionAsync();
        try
        {
            await db.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT dbo.Patients ON");
            db.Patients.Add(collision);
            await db.SaveChangesAsync();
        }
        finally
        {
            await db.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT dbo.Patients OFF");
            await db.Database.CloseConnectionAsync();
        }
        var walkInVisit = Visit(1, 0, collision);
        walkInVisit.StartTime = TimeSpan.FromHours(10);
        walkInVisit.EndTime = TimeSpan.FromHours(10.5);
        var walkInBook = new PatientBook { PatientId = collision.PatientId, BookNumber = "MERGE-WALKIN", Status = "Issued", IssuedAt = now };
        db.PatientBooks.Add(walkInBook);
        await db.SaveChangesAsync();
        walkInVisit.PatientBookId = walkInBook.PatientBookId;
        db.Appointments.Add(walkInVisit);
        await db.SaveChangesAsync();
        await Login("testdoctor");
        var walkIn = await Send(HttpMethod.Post, "api/LabTests", new { appointmentId = walkInVisit.AppointmentId, labTestTypeId = typeId });
        var walkInLabId = walkIn["id"]!.GetValue<int>();
        check(walkIn["patientName"]!.GetValue<string>() == collision.FullName
            && await db.LabTests.AnyAsync(t => t.Id == walkInLabId && t.PatientProfileId == collision.PatientId),
            "Walk-in orders persist the profile identity even when its ID collides with an account");
        await Login("mergepatient");
        await Send(HttpMethod.Get, $"api/LabTests/{walkInLabId}", status: 404);
        var ownLabs = await Send(HttpMethod.Get, "api/LabTests");
        check(!ownLabs.AsArray().Any(t => t!["id"]!.GetValue<int>() == walkInLabId), "An ID collision never exposes another patient's lab order");
        await Login("testadmin");
        await Send(HttpMethod.Post, "api/invoices", InvoiceBody(walkInVisit, "LabAndConsultation", [Item("LabTest", walkInLabId)], null));
        await Login("testlab");
        await Send(HttpMethod.Post, "api/LabTests/results", new { labTestId = walkInLabId, resultSummary = "Walk-in private result" });
        check(!await db.Notifications.AnyAsync(n => n.UserId == user.UserId && n.EventKey == $"lab-result:{walkInLabId}:Completed"),
            "An unlinked walk-in result never notifies the unrelated patient with the same numeric ID");

        await Login("testreceptionist");
        var bookRequest = await Send(HttpMethod.Post, $"api/patients/{collision.PatientId}/book-requests", new { reason = "Lost" });
        var requestId = bookRequest["patientBookRequestId"]!.GetValue<int>();
        await Login("testadmin");
        var bookQueue = await Send(HttpMethod.Get, "api/invoices/pending?stage=Book");
        check(bookQueue.AsArray().Any(q => q!["items"]!.AsArray().Any(i => i!["sourceType"]!.GetValue<string>() == "BookRequest"
            && i["sourceId"]!.GetValue<int>() == requestId) && q["totalAmount"]!.GetValue<decimal>() == 17000m),
            "The book-request queue uses the configured patient-book fee");
        var bookBill = await Send(HttpMethod.Post, "api/invoices", new
        {
            patientId = collision.PatientId, billingStage = "Book", initialPaymentAmount = 0,
            items = new[] { Item("BookRequest", requestId) }
        });
        check(bookBill["totalAmount"]!.GetValue<decimal>() == 17000m, "Book invoices also rebuild their price from clinic settings");
        var linkedBookInvoiceId = await db.PatientBookRequests.AsNoTracking().Where(r => r.PatientBookRequestId == requestId)
            .Select(r => r.BookInvoiceId!.Value).SingleAsync();
        bookQueue = await Send(HttpMethod.Get, "api/invoices/pending?stage=Book");
        check(!bookQueue.AsArray().Any(q => q!["items"]!.AsArray().Any(i => i!["sourceType"]!.GetValue<string>() == "Book"
            && i["sourceId"]!.GetValue<int>() == linkedBookInvoiceId)), "A billed request never reappears under its linked Book source");
        await Send(HttpMethod.Post, "api/invoices", new
        {
            patientId = collision.PatientId, billingStage = "Book", initialPaymentAmount = 0,
            items = new[] { Item("Book", linkedBookInvoiceId) }
        }, 409);
        await Send(HttpMethod.Post, $"api/invoices/{bookBill["id"]!.GetValue<int>()}/payments", new { amount = 17000m, paymentMethod = "Cash" });
        check(await db.PatientBookRequests.AsNoTracking().AnyAsync(r => r.PatientBookRequestId == requestId && r.BookInvoice!.Status == "Paid"),
            "Settling a book request updates the book invoice used by reception");

        var medicine = new Medicine { MedicineName = "Merge reconciliation medicine", Unit = "Viên", UnitPrice = 1000m,
            CategoryId = await db.MedicineCategories.Select(c => c.CategoryId).FirstAsync(),
            SupplierId = await db.Suppliers.Select(s => s.SupplierId).FirstAsync() };
        db.Medicines.Add(medicine);
        await db.SaveChangesAsync();
        var record = new MedicalRecord { AppointmentId = nearerVisit.AppointmentId, DoctorId = 1,
            PatientId = user.UserId, PatientBookId = book.PatientBookId, Symptoms = "Merge check", Conclusion = "Merge check",
            ExaminationDate = now, CreatedAt = now, UpdatedAt = now };
        var prescription = new Prescription { MedicalRecord = record, Status = PrescriptionStatusConstants.Issued,
            PrescriptionDate = now, CreatedAt = now, UpdatedAt = now,
            Details = [new PrescriptionDetail { MedicineId = medicine.MedicineId, Quantity = 20, Dosage = "Ngày 2 lần", Instructions = "Sau ăn" }] };
        db.Prescriptions.Add(prescription);
        await db.SaveChangesAsync();
        var rxInvoice = await Send(HttpMethod.Post, "api/invoices", InvoiceBody(nearerVisit, "Medicine",
            [Item("PrescriptionDetail", prescription.Details.Single().PrescriptionDetailId)], null));
        var rxInvoiceId = rxInvoice["id"]!.GetValue<int>();
        var review = new PrescriptionStockReview { PrescriptionId = prescription.PrescriptionId, InvoiceId = rxInvoiceId,
            CreatedByUserId = await db.Users.Where(u => u.Username == "testadmin").Select(u => u.UserId).SingleAsync(),
            PaymentStatus = "Paid", CreatedAt = now, UpdatedAt = now };
        db.PrescriptionStockReviews.Add(review);
        await db.SaveChangesAsync();
        await Login("testdoctor");
        var reviewDetail = await Send(HttpMethod.Get, $"api/stock-reviews/{review.PrescriptionStockReviewId}");
        reviewDetail = await Send(HttpMethod.Post, $"api/stock-reviews/{review.PrescriptionStockReviewId}/responses", new
        {
            action = "AdjustPrescription", reason = "Điều chỉnh đơn thiếu tồn", expectedReviewUpdatedAt = reviewDetail["review"]!["updatedAt"]!.GetValue<string>(),
            expectedPrescriptionUpdatedAt = reviewDetail["prescriptionUpdatedAt"]!.GetValue<string>(),
            details = new[] { new { medicineId = medicine.MedicineId, quantity = 12, dosage = "Ngày 2 lần", instructions = "Sau ăn" } }
        });
        check(!reviewDetail["canApplyProposal"]!.GetValue<bool>(), "A billed clinical proposal stays locked before financial reconciliation");
        object Adjustment(decimal amount) => new
        {
            originalInvoiceId = rxInvoiceId, prescriptionStockReviewId = review.PrescriptionStockReviewId,
            reason = "Hoàn tiền theo phương án đã chốt", adjustmentTotalAmount = amount, adjustmentPatientAmount = amount,
            paymentMethod = "Cash", items = new[] { new { sourceType = "Adjustment", sourceId = rxInvoiceId, itemName = "Chênh lệch thuốc", unitPrice = amount, quantity = 1 } }
        };
        await Login("testadmin");
        await Send(HttpMethod.Post, "api/invoices/adjustment", Adjustment(-1m), 400);
        var refund = await Send(HttpMethod.Post, "api/invoices/adjustment", Adjustment(-8000m));
        check(refund["status"]!.GetValue<string>() == "Refunded" && refund["originalInvoiceId"]!.GetValue<int>() == rxInvoiceId
            && refund["payments"]!.AsArray().Single()!["amount"]!.GetValue<decimal>() == 8000m,
            "Verified prescription reconciliation creates a traceable refund receipt");
        await Login("testdoctor");
        reviewDetail = await Send(HttpMethod.Get, $"api/stock-reviews/{review.PrescriptionStockReviewId}");
        check(reviewDetail["canApplyProposal"]!.GetValue<bool>(), "The billing confirmation uses the contract accepted by the doctor's apply action");
        await Send(HttpMethod.Post, $"api/stock-reviews/{review.PrescriptionStockReviewId}/apply-proposal", new
        {
            expectedReviewUpdatedAt = reviewDetail["review"]!["updatedAt"]!.GetValue<string>(),
            expectedPrescriptionUpdatedAt = reviewDetail["prescriptionUpdatedAt"]!.GetValue<string>()
        });
        check(await db.PrescriptionDetails.AsNoTracking().AnyAsync(d => d.PrescriptionId == prescription.PrescriptionId && d.Quantity == 12),
            "The doctor applies exactly the financially reconciled replacement quantity");
        check(await db.Invoices.AsNoTracking().AnyAsync(i => i.Id == rxInvoiceId && i.PaidAmount == 20000m && i.TotalAmount == 20000m),
            "Reconciliation preserves the original invoice and payment amounts");

        async Task<JsonNode> Adjust(int invoiceId, decimal change, decimal expectedRefund, decimal expectedRemaining,
            int? reviewId = null, int status = 200, decimal? expectedPatient = null) =>
            await Send(HttpMethod.Post, "api/invoices/adjustment", new
            {
                originalInvoiceId = invoiceId, prescriptionStockReviewId = reviewId,
                adjustmentTotalAmount = change, adjustmentPatientAmount = change,
                reason = "Điều chỉnh phí kiểm thử", expectedRefundAmount = expectedRefund, expectedRemainingAmount = expectedRemaining,
                expectedPatientAmount = expectedPatient
            }, status);
        await Login("testadmin");
        var consultation = await Send(HttpMethod.Post, "api/invoices", InvoiceBody(otherDoctorVisit, "Pending",
            [Item("Appointment", otherDoctorVisit.AppointmentId)], 50000m));
        var consultationId = consultation["id"]!.GetValue<int>();
        await Adjust(consultationId, -100000m, 0m, 1m, status: 409);
        var reduction = await Adjust(consultationId, -100000m, 0m, 37000m);
        check(reduction["status"]!.GetValue<string>() == "Adjusted" && reduction["payments"]!.AsArray().Count == 0,
            "A fee reduction first offsets the outstanding balance and issues no refund");
        await Send(HttpMethod.Post, $"api/invoices/{consultationId}/payments", new { amount = 37001m }, 400);
        var waiver = await Adjust(consultationId, -37000m, 0m, 0m);
        check(waiver["payments"]!.AsArray().Count == 0, "Waiving the remaining balance creates no fictitious cash entry");
        await Adjust(consultationId, -20000m, 20000m, 0m, expectedPatient: 30000m);
        await Adjust(consultationId, -20000m, 20000m, 0m, status: 409, expectedPatient: 30000m);
        await Adjust(consultationId, -30001m, 30001m, 0m, status: 400);
        consultation = await Send(HttpMethod.Get, $"api/invoices/{consultationId}");
        check(consultation["status"]!.GetValue<string>() == "Paid" && consultation["originalPatientAmount"]!.GetValue<decimal>() == 187000m
            && consultation["patientAmount"]!.GetValue<decimal>() == 30000m && consultation["paidAmount"]!.GetValue<decimal>() == 30000m
            && consultation["payments"]!.AsArray().Single()!["amount"]!.GetValue<decimal>() == 50000m,
            "Fee adjustment reads the net balance while preserving original charges and receipt");

        var pharmacistRoleId = await db.Roles.Where(r => r.RoleName == RoleConstants.Pharmacist).Select(r => r.RoleId).SingleAsync();
        db.Users.Add(new User { Username = "mergepharmacist", FullName = "Merge pharmacist", PasswordHash = hash, RoleId = pharmacistRoleId });
        await db.SaveChangesAsync();
        for (var index = 0; index < 3; index++)
        {
            var newVisit = Visit(1, -10 - index, profile);
            var newRx = new Prescription
            {
                MedicalRecord = new MedicalRecord { Appointment = newVisit, DoctorId = 1, PatientId = user.UserId, PatientBookId = book.PatientBookId,
                    Symptoms = "Payment check", ExaminationDate = now, CreatedAt = now, UpdatedAt = now },
                Status = PrescriptionStatusConstants.Issued, PrescriptionDate = now, CreatedAt = now, UpdatedAt = now,
                Details = [new PrescriptionDetail { MedicineId = medicine.MedicineId, Quantity = 20, Dosage = "Theo đơn", Instructions = "Sau ăn" }]
            };
            db.Prescriptions.Add(newRx);
            await db.SaveChangesAsync();
            var initial = new[] { 0m, 5000m, 15000m }[index];
            await Login("testadmin");
            var bill = await Send(HttpMethod.Post, "api/invoices", InvoiceBody(newVisit, "Medicine",
                [Item("PrescriptionDetail", newRx.Details.Single().PrescriptionDetailId)], initial));
            var billId = bill["id"]!.GetValue<int>();
            var stockReview = new PrescriptionStockReview { PrescriptionId = newRx.PrescriptionId, InvoiceId = billId,
                CreatedByUserId = review.CreatedByUserId, PaymentStatus = bill["status"]!.GetValue<string>(), CreatedAt = now, UpdatedAt = now };
            db.PrescriptionStockReviews.Add(stockReview);
            await db.SaveChangesAsync();
            var stockReviewId = stockReview.PrescriptionStockReviewId;
            var stockPath = $"api/stock-reviews/{stockReviewId}";
            await Login("testdoctor");
            var snapshot = await Send(HttpMethod.Get, stockPath);
            await Send(HttpMethod.Post, stockPath + "/responses", new
            {
                action = "AdjustPrescription", reason = "Điều chỉnh số lượng thiếu tồn",
                expectedReviewUpdatedAt = snapshot["review"]!["updatedAt"]!.GetValue<string>(),
                expectedPrescriptionUpdatedAt = snapshot["prescriptionUpdatedAt"]!.GetValue<string>(),
                details = new[] { new { medicineId = medicine.MedicineId, quantity = 12, dosage = "Theo đơn", instructions = "Sau ăn" } }
            });
            await Login("testadmin");
            var history = await Send(HttpMethod.Get, $"api/invoices/history?search={billId}");
            check(history.AsArray().Any(i => i!["id"]!.GetValue<int>() == billId
                && i["pendingStockReviewId"]?.GetValue<int>() == stockReviewId), "Cashier history identifies the pending proposal on its original invoice");
            if (initial < 12000m)
                await Send(HttpMethod.Post, $"api/invoices/{billId}/payments", new { amount = 1000m }, 400);
            var preview = await Send(HttpMethod.Post, "api/invoices/adjustment/preview",
                new { originalInvoiceId = billId, prescriptionStockReviewId = stockReviewId });
            var remaining = Math.Max(0m, 12000m - initial);
            var refundAmount = Math.Max(0m, initial - 12000m);
            check(preview["patientChange"]!.GetValue<decimal>() == -8000m && preview["remainingAmount"]!.GetValue<decimal>() == remaining
                && preview["refundAmount"]!.GetValue<decimal>() == refundAmount, "The stock review quote computes the required settlement from actual receipts");
            var adjusted = await Adjust(billId, -8000m, refundAmount, remaining, stockReviewId);
            check(adjusted["payments"]!.AsArray().Count == (refundAmount > 0 ? 1 : 0), "The stock adjustment refunds only the cash overpayment");
            await Login("testdoctor");
            snapshot = await Send(HttpMethod.Get, stockPath);
            object Apply(JsonNode detail) => new
            {
                expectedReviewUpdatedAt = detail["review"]!["updatedAt"]!.GetValue<string>(),
                expectedPrescriptionUpdatedAt = detail["prescriptionUpdatedAt"]!.GetValue<string>()
            };
            if (remaining > 0)
            {
                check(!snapshot["canApplyProposal"]!.GetValue<bool>(), "An unsettled adjusted prescription remains locked");
                await Send(HttpMethod.Post, stockPath + "/apply-proposal", Apply(snapshot), 409);
                await Login("testadmin");
                await Send(HttpMethod.Post, $"api/invoices/{billId}/payments", new { amount = remaining - 1000m });
                await Login("testdoctor");
                snapshot = await Send(HttpMethod.Get, stockPath);
                check(!snapshot["canApplyProposal"]!.GetValue<bool>(), "A partial second payment still keeps the proposal locked");
                await Login("testadmin");
                await Send(HttpMethod.Post, $"api/invoices/{billId}/payments", new { amount = 1000m });
                await Login("testdoctor");
                snapshot = await Send(HttpMethod.Get, stockPath);
            }
            check(snapshot["canApplyProposal"]!.GetValue<bool>(), "Full settlement unlocks the exact proposal");
            await Send(HttpMethod.Post, stockPath + "/apply-proposal", Apply(snapshot));
            await Login("mergepharmacist");
            var dispensing = await Send(HttpMethod.Get, $"api/dispensing/{newRx.PrescriptionId}");
            check(dispensing["paymentStatus"]!.GetValue<string>() == "Paid" && !dispensing["canDispense"]!.GetValue<bool>(),
                "Pharmacy recognizes the adjusted settlement and still enforces its recheck and paper-book rules");
        }

        await Login("testadmin");
        var newBook = await Send(HttpMethod.Post, $"api/patients/{profile.PatientId}/book-invoices", new { amount = 13000m });
        var legacyBookId = newBook["bookInvoiceId"]!.GetValue<int>();
        await Send(HttpMethod.Patch, $"api/book-invoices/{legacyBookId}/pay");
        var bookToMerge = await Send(HttpMethod.Post, $"api/patients/{profile.PatientId}/book-invoices", new { amount = 10000m });
        var mergedBookId = bookToMerge["bookInvoiceId"]!.GetValue<int>();
        var mergedBook = await Send(HttpMethod.Post, "api/invoices", new
        {
            patientId = profile.PatientId, billingStage = "Book", initialPaymentAmount = 4000m, items = new[] { Item("Book", mergedBookId) }
        });
        await Send(HttpMethod.Patch, $"api/book-invoices/{mergedBookId}/pay", status: 409);
        var today = ClinicClock.Today.ToString("yyyy-MM-dd");
        var report = await Send(HttpMethod.Get, $"api/admin-dashboard/revenue?from={today}&to={today}");
        var ledger = await db.InvoicePayments.SumAsync(p => p.PaymentType == "Refund" ? -p.Amount : p.Amount);
        check(report["summary"]!["patientPayments"]!.GetValue<decimal>() == ledger + 13000m,
            "Daily revenue counts receipt amounts, refunds and legacy books once");
        var visits = await Send(HttpMethod.Get, $"api/admin-dashboard/appointments?from={today}&to={today}");
        var expectedVisits = await db.Appointments.CountAsync(a => a.AppointmentDate == ClinicClock.Today.ToDateTime(TimeOnly.MinValue));
        check(visits["summary"]!["totalAppointments"]!.GetValue<int>() == expectedVisits, "Appointment report includes the selected end day");
        await Send(HttpMethod.Get, "api/admin-dashboard/revenue?from=2026-12-01&to=2026-11-01", status: 400);
        await Send(HttpMethod.Get, "api/admin-dashboard/appointments?from=2020-01-01&to=2020-01-02");
        await Send(HttpMethod.Get, "api/patients/me/invoices", status: 403);
        await Login("mergepatient");
        await Send(HttpMethod.Get, $"api/admin-dashboard/revenue?from={today}&to={today}", status: 403);
        var myPage = await Send(HttpMethod.Get, "api/patients/me/invoices?pageSize=100");
        var myInvoices = myPage["items"]!.AsArray();
        check(myInvoices.Count == myPage["totalItems"]!.GetValue<int>()
            && myInvoices.Any(i => i!["source"]!.GetValue<string>() == "BookInvoice" && i["id"]!.GetValue<int>() == legacyBookId
                && i["payments"]!.AsArray().Count == 1)
            && myInvoices.Count(i => i!["billingStage"]!.GetValue<string>() == "Book") == 2,
            "Patient portal includes legacy and cashier book charges once each");
        check(myInvoices.Any(i => i!["id"]!.GetValue<int>() == mergedBook["id"]!.GetValue<int>()
            && i["remainingAmount"]!.GetValue<decimal>() == 6000m)
            && myInvoices.Any(i => i!["id"]!.GetValue<int>() == invoiceId && i["payments"]!.AsArray().Count == 2)
            && myInvoices.Any(i => i!["originalInvoiceId"]?.GetValue<int>() == consultationId && i["status"]!.GetValue<string>() == "Refunded")
            && !myInvoices.Any(i => i!["appointmentId"]?.GetValue<int>() == walkInVisit.AppointmentId),
            "Only the patient's bills, balances, payments and refunds appear even with a colliding account/profile number");
        myPage = await Send(HttpMethod.Get, "api/patients/me/invoices?pageSize=1&pageNumber=2");
        check(myPage["items"]!.AsArray().Count == 1 && myPage["pageNumber"]!.GetValue<int>() == 2, "Patient invoice history is paginated");
    }
}

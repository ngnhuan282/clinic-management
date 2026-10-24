using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Helpers;
using Microsoft.EntityFrameworkCore;

internal static class PrescriptionDispensingChecks
{
    internal record UiFixture(int PrescriptionId, int AppointmentId, int MedicalRecordId,
        int PatientId, int MedicineId, int DetailId, int ShortagePrescriptionId);

    public static async Task<UiFixture> RunAsync(HttpClient client, ApplicationDbContext db,
        string password, Action<bool, string> check)
    {
        var today = ClinicClock.Today;
        var hash = await db.Users.Where(x => x.Username == "testadmin").Select(x => x.PasswordHash).SingleAsync();
        var pharmacyRole = await db.Roles.Where(x => x.RoleName == RoleConstants.Pharmacist).Select(x => x.RoleId).SingleAsync();
        var cashierRole = await db.Roles.SingleOrDefaultAsync(x => x.RoleName == RoleConstants.Cashier);
        if (cashierRole == null)
        {
            cashierRole = new Role { RoleName = RoleConstants.Cashier, Description = "D8 fixture", IsSystem = true };
            db.Roles.Add(cashierRole);
            await db.SaveChangesAsync();
        }
        foreach (var permission in new[] { PermissionCodes.BillingCreate, PermissionCodes.BillingRecordPayment })
            if (!await db.RolePermissions.AnyAsync(x => x.RoleId == cashierRole.RoleId && x.PermissionCode == permission))
                db.RolePermissions.Add(new RolePermission { RoleId = cashierRole.RoleId, PermissionCode = permission });
        var pharmacist = new User { Username = "d8pharmacist", FullName = "D8 Pharmacist", RoleId = pharmacyRole, PasswordHash = hash };
        var peer = new User { Username = "d8pharmacist2", FullName = "D8 Second pharmacist", RoleId = pharmacyRole, PasswordHash = hash };
        var cashier = new User { Username = "d8cashier", FullName = "D8 Cashier", RoleId = cashierRole.RoleId, PasswordHash = hash };
        var patientAccount = new User { Username = "d8patient", FullName = "D8 Patient", RoleId = 4, PasswordHash = hash };
        db.Users.AddRange(pharmacist, peer, cashier, patientAccount);
        await db.SaveChangesAsync();
        var categoryId = await db.MedicineCategories.Select(x => x.CategoryId).FirstAsync();
        var supplierId = await db.Suppliers.Select(x => x.SupplierId).FirstAsync();
        var diseaseId = await db.Diseases.Select(x => x.DiseaseId).FirstAsync();
        string? token = null;
        var number = 0;

        async Task<JsonNode> Send(HttpMethod method, string path, object? body = null,
            int status = 200, int? code = null)
        {
            using var request = new HttpRequestMessage(method, path);
            if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status,
                $"D8 {method} {path}: expected {status}, got {(int)response.StatusCode}"
                + ((int)response.StatusCode == status ? "" : " " + text));
            var json = JsonNode.Parse(text)!;
            if (code.HasValue) check(json["code"]?.GetValue<int>() == code, $"D8 business conflict code {code}");
            return json is JsonObject envelope && envelope.ContainsKey("result") ? json["result"]! : json;
        }
        async Task<string> Login(string username)
        {
            token = null;
            var session = await Send(HttpMethod.Post, "api/auth/login", new { username, password });
            return token = session["accessToken"]!.GetValue<string>();
        }
        async Task<string> Stock() => JsonSerializer.Serialize(await db.Inventory.AsNoTracking()
            .OrderBy(x => x.InventoryId).Select(x => new { x.InventoryId, x.QuantityInStock }).ToListAsync());
        async Task<Medicine> Medicine(string name, params (string Batch, int Quantity, int Days)[] lots)
        {
            var medicine = new Medicine { MedicineName = "D8 " + name, CategoryId = categoryId,
                SupplierId = supplierId, Unit = "Vien", UnitPrice = 1000m };
            foreach (var lot in lots)
                db.Inventory.Add(new Inventory { Medicine = medicine, BatchNumber = lot.Batch,
                    QuantityInStock = lot.Quantity, ExpiryDate = today.AddDays(lot.Days) });
            if (lots.Length == 0) db.Medicines.Add(medicine);
            await db.SaveChangesAsync();
            return medicine;
        }
        object Prescription(int recordId, params (Medicine Medicine, int Quantity)[] details) => new
        {
            medicalRecordId = recordId, notes = "D8 prescription",
            details = details.Select(x => new { medicineId = x.Medicine.MedicineId, quantity = x.Quantity,
                dosage = "One daily", instructions = "After meals" }).ToArray()
        };
        async Task<Prescription> Order(string label, bool account, params (Medicine Medicine, int Quantity)[] medicines)
        {
            number++;
            var patient = new Patient { FullName = "D8 " + label, Phone = "090088" + number.ToString("D4"),
                UserId = account ? patientAccount.UserId : null, CreatedAt = DateTime.UtcNow };
            var book = new PatientBook { Patient = patient, BookNumber = "D8-" + number, Status = "Issued", IssuedAt = DateTime.UtcNow };
            var appointment = new Appointment { DoctorId = 1, PatientProfile = patient, PatientBook = book,
                PatientId = account ? patientAccount.UserId : null, PatientName = patient.FullName, PatientPhone = patient.Phone,
                AppointmentDate = today.ToDateTime(TimeOnly.MinValue), StartTime = TimeSpan.FromMinutes(number * 15),
                EndTime = TimeSpan.FromMinutes(number * 15 + 10), Status = "InProgress",
                CheckedInAt = DateTime.UtcNow, BookVerifiedAt = DateTime.UtcNow };
            db.Appointments.Add(appointment);
            await db.SaveChangesAsync();
            await Login("testdoctor");
            var record = await Send(HttpMethod.Post, "api/medical-records", new
            {
                appointmentId = appointment.AppointmentId, patientBookId = book.PatientBookId,
                symptoms = "D8 symptoms", conclusion = "D8 conclusion",
                diagnoses = new[] { new { diseaseId, isPrimary = true } }
            }, 201);
            var recordId = record["medicalRecordId"]!.GetValue<int>();
            var stock = await Stock();
            var rx = await Send(HttpMethod.Post, "api/prescriptions", Prescription(recordId, medicines), 201);
            check(stock == await Stock(), "D8 issuing a prescription never reserves or deducts stock");
            return await db.Prescriptions.AsNoTracking().Include(x => x.Details).ThenInclude(x => x.Medicine)
                .Include(x => x.MedicalRecord).ThenInclude(x => x.Appointment)
                .SingleAsync(x => x.PrescriptionId == rx["prescriptionId"]!.GetValue<int>());
        }
        int PatientId(Prescription rx) => rx.MedicalRecord.PatientId ?? rx.MedicalRecord.Appointment.PatientProfileId!.Value;
        async Task<Invoice> InvoiceFixture(Prescription rx, string status = "Paid", string stage = "Medicine",
            string type = "Standard", int? patientId = null, int? appointmentId = null,
            bool wrongSource = false, bool partial = false)
        {
            var invoice = new Invoice { AppointmentId = appointmentId ?? rx.MedicalRecord.AppointmentId,
                PatientId = patientId ?? PatientId(rx), CashierId = cashier.UserId, BillingStage = stage,
                Status = status, InvoiceType = type, TotalAmount = 1000m, PatientAmount = 1000m,
                InvoiceDetails = rx.Details.Take(partial ? 1 : rx.Details.Count).Select(x => new InvoiceDetail
                {
                    SourceType = "PrescriptionDetail", SourceId = wrongSource ? int.MaxValue : x.PrescriptionDetailId,
                    ItemName = x.Medicine.MedicineName, UnitPrice = 1000m, Quantity = x.Quantity, TotalPrice = x.Quantity * 1000m
                }).ToList() };
            db.Invoices.Add(invoice);
            await db.SaveChangesAsync();
            return invoice;
        }
        object InvoiceRequest(Prescription rx, string stage = "Medicine") => new
        {
            appointmentId = rx.MedicalRecord.AppointmentId, patientId = PatientId(rx), billingStage = stage,
            paymentMethod = "Cash", items = rx.Details.Select(x => new { sourceType = "PrescriptionDetail",
                sourceId = x.PrescriptionDetailId, itemName = x.Medicine.MedicineName, unitPrice = 1000m, quantity = x.Quantity }).ToArray()
        };
        async Task<Invoice> Pay(Prescription rx, string stage = "Medicine")
        {
            await Login(cashier.Username);
            var stock = await Stock();
            var invoice = await Send(HttpMethod.Post, "api/Invoices", InvoiceRequest(rx, stage));
            check(invoice["status"]!.GetValue<string>() == "Paid" && stock == await Stock(),
                "D8 actual cashier API records payment without handing over or deducting stock");
            return await db.Invoices.AsNoTracking().SingleAsync(x => x.Id == invoice["id"]!.GetValue<int>());
        }
        async Task<JsonNode> Detail(Prescription rx) => await Send(HttpMethod.Get, $"api/dispensing/{rx.PrescriptionId}");
        async Task DeniedInvoice(Prescription rx, Invoice invoice, string description)
        {
            var stock = await Stock();
            await Login(pharmacist.Username);
            var detail = await Detail(rx);
            check(!detail["canDispense"]!.GetValue<bool>(), "D8 cannot hand over with " + description);
            var queue = await Send(HttpMethod.Get, $"api/dispensing?workflowStatus=Ready&search=RX-{rx.PrescriptionId:D5}");
            check(queue["totalItems"]!.GetValue<int>() == 0, "D8 Ready queue agrees with detail for " + description);
            await Send(HttpMethod.Post, $"api/dispensing/{rx.PrescriptionId}/confirm", status: 409, code: 7404);
            check(stock == await Stock() && !await db.DispenseDetails.AnyAsync(x => x.PrescriptionDetail.PrescriptionId == rx.PrescriptionId),
                "D8 rejected handover is atomic for " + description);
            db.Invoices.Remove(invoice);
            await db.SaveChangesAsync();
        }

        var first = await Medicine("FEFO first", ("EXPIRED", 99, -1), ("TODAY", 2, 0),
            ("EARLY-A", 3, 5), ("EARLY-B", 3, 5), ("LATER", 20, 30));
        var second = await Medicine("FEFO second", ("SECOND", 20, 20));
        var order = await Order("Account patient", true, (first, 8), (second, 3));
        var unchangedStock = await Stock();
        await Send(HttpMethod.Put, $"api/prescriptions/{order.PrescriptionId}", Prescription(order.MedicalRecordId, (first, 9), (second, 3)));
        check(unchangedStock == await Stock(), "D8 adjusting quantities never deducts stock");
        await Send(HttpMethod.Put, $"api/prescriptions/{order.PrescriptionId}", Prescription(order.MedicalRecordId, (first, 8), (second, 3)));
        var recordAfterEdit = await Send(HttpMethod.Get, $"api/medical-records/{order.MedicalRecordId}");
        check(recordAfterEdit["paperBookUpdatedAt"] == null, "D8 edited prescription requires paper-book reconfirmation");
        await Send(HttpMethod.Put, $"api/medical-records/{order.MedicalRecordId}", new
        {
            expectedUpdatedAt = recordAfterEdit["updatedAt"]!.GetValue<string>(), symptoms = "D8 symptoms", conclusion = "D8 conclusion",
            paperBookConfirmed = true, markCompleted = true, diagnoses = new[] { new { diseaseId, isPrimary = true } }
        });
        await Login(pharmacist.Username);
        var initial = await Detail(order);
        check(initial["workflowStatus"]!.GetValue<string>() == "AwaitingPayment" && !initial["canDispense"]!.GetValue<bool>(),
            "D8 Completed examination and enough stock are not evidence of payment");
        await Send(HttpMethod.Post, $"api/dispensing/{order.PrescriptionId}/confirm", status: 409, code: 7404);

        foreach (var status in new[] { "Unpaid", "PartiallyPaid", "Cancelled" })
            await DeniedInvoice(order, await InvoiceFixture(order, status), status + " invoice");
        foreach (var stage in new[] { "Book", "LabAndConsultation" })
            await DeniedInvoice(order, await InvoiceFixture(order, stage: stage), "Paid " + stage + " invoice");
        await DeniedInvoice(order, await InvoiceFixture(order, appointmentId: int.MaxValue), "another appointment");
        await DeniedInvoice(order, await InvoiceFixture(order, wrongSource: true), "another prescription source");
        await DeniedInvoice(order, await InvoiceFixture(order, partial: true), "only one of the medicine sources");
        await DeniedInvoice(order, await InvoiceFixture(order, patientId: int.MaxValue), "another billing patient");
        await DeniedInvoice(order, await InvoiceFixture(order, type: "Adjustment"), "a Paid adjustment document instead of a medicine charge");

        var paidInvoice = await Pay(order, "Final");
        var billedSources = await db.InvoiceDetails.AsNoTracking().Where(x => x.InvoiceId == paidInvoice.Id)
            .OrderBy(x => x.Id).Select(x => new { x.Id, x.SourceType, x.SourceId, x.Quantity, x.TotalPrice }).ToListAsync();
        await Login(pharmacist.Username);
        var paid = await Detail(order);
        check(paid["canDispense"]!.GetValue<bool>() && paid["invoiceId"]!.GetValue<int>() == paidInvoice.Id,
            "D8 actual Final payment unlocks the matching prescription without changing prescription status");
        check(paid["prescriptionStatus"]!.GetValue<string>() == "Issued" && unchangedStock == await Stock(),
            "D8 paid and not-yet-handed-over remains Issued with unchanged stock");
        var expectedLots = paid["medicines"]!.AsArray().Single(x => x!["medicineId"]!.GetValue<int>() == first.MedicineId)!["allocations"]!.AsArray();
        check(expectedLots.Select(x => x!["batchNumber"]!.GetValue<string>()).SequenceEqual(new[] { "TODAY", "EARLY-A", "EARLY-B" }),
            "D8 FEFO includes today, excludes expired lots and breaks equal-expiry ties by inventory ID");
        foreach (var username in new[] { "testdoctor", cashier.Username, "testreceptionist", "testlab", patientAccount.Username })
        {
            await Login(username);
            await Send(HttpMethod.Get, $"api/dispensing/{order.PrescriptionId}", status: 403);
            await Send(HttpMethod.Post, $"api/dispensing/{order.PrescriptionId}/confirm", status: 403);
        }
        token = null;
        await Send(HttpMethod.Post, $"api/dispensing/{order.PrescriptionId}/confirm", status: 401);
        await Login(pharmacist.Username);
        var dispensed = await Send(HttpMethod.Post, $"api/dispensing/{order.PrescriptionId}/confirm");
        check(dispensed["prescriptionStatus"]!.GetValue<string>() == "Dispensed"
            && dispensed["dispensedByUserId"]!.GetValue<int>() == pharmacist.UserId && dispensed["dispensedAt"] != null,
            "D8 successful handover records the pharmacist and time");
        var rows = await db.DispenseDetails.AsNoTracking().Include(x => x.Inventory).Include(x => x.PrescriptionDetail)
            .Where(x => x.PrescriptionDetail.PrescriptionId == order.PrescriptionId).ToListAsync();
        check(rows.Count == 4 && rows.Sum(x => x.QuantityDispensed) == 11 && rows.All(x => x.Inventory.MedicineId == x.PrescriptionDetail.MedicineId
            && x.Inventory.ExpiryDate >= today && x.QuantityDispensed > 0), "D8 every actual dispense line traces the correct non-expired medicine lot");
        check(await db.Inventory.AsNoTracking().Where(x => x.MedicineId == first.MedicineId && x.BatchNumber == "EXPIRED")
            .Select(x => x.QuantityInStock).SingleAsync() == 99, "D8 expired physical stock never changes");
        var afterHandover = await Stock();
        await Send(HttpMethod.Post, $"api/dispensing/{order.PrescriptionId}/confirm", status: 400, code: 7403);
        check(afterHandover == await Stock() && await db.DispenseDetails.CountAsync(x => x.PrescriptionDetail.PrescriptionId == order.PrescriptionId) == 4,
            "D8 retrying a completed handover never deducts stock or duplicates lot history");
        var invoiceAfterHandover = await db.Invoices.AsNoTracking().SingleAsync(x => x.Id == paidInvoice.Id);
        check(invoiceAfterHandover.Status == paidInvoice.Status && invoiceAfterHandover.TotalAmount == paidInvoice.TotalAmount
            && invoiceAfterHandover.PatientAmount == paidInvoice.PatientAmount
            && billedSources.SequenceEqual(await db.InvoiceDetails.AsNoTracking().Where(x => x.InvoiceId == paidInvoice.Id)
                .OrderBy(x => x.Id).Select(x => new { x.Id, x.SourceType, x.SourceId, x.Quantity, x.TotalPrice }).ToListAsync()),
            "D8 handover and retries never rewrite invoice money or billing sources");

        var disposable = await Order("Cancel before billing", false, (second, 2));
        var beforeCancel = await Stock();
        await Send(HttpMethod.Patch, $"api/prescriptions/{disposable.PrescriptionId}/cancel");
        check(beforeCancel == await Stock(), "D8 cancelling an unbilled prescription never changes inventory");
        await Login(pharmacist.Username);
        await Send(HttpMethod.Post, $"api/dispensing/{disposable.PrescriptionId}/confirm", status: 400, code: 7403);

        async Task Race(Prescription left, Prescription right, int expectedTotal)
        {
            var before = await db.Inventory.AsNoTracking().SumAsync(x => x.QuantityInStock);
            var firstToken = await Login(pharmacist.Username);
            var secondToken = await Login(peer.Username);
            async Task<int> Confirm(Prescription rx, string access)
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, $"api/dispensing/{rx.PrescriptionId}/confirm");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", access);
                using var response = await client.SendAsync(request);
                return (int)response.StatusCode;
            }
            var statuses = await Task.WhenAll(Confirm(left, firstToken), Confirm(right, secondToken));
            check(statuses.Count(x => x == 200) == 1 && statuses.All(x => x is 200 or 400 or 409),
                "D8 concurrent pharmacists commit one handover without server errors: " + string.Join(",", statuses));
            check(before - await db.Inventory.AsNoTracking().SumAsync(x => x.QuantityInStock) == expectedTotal
                && !await db.Inventory.AnyAsync(x => x.QuantityInStock < 0), "D8 concurrent requests never overdraw a shared lot");
        }
        var raceMedicine = await Medicine("Same prescription race", ("RACE-A", 2, 5), ("RACE-B", 8, 10));
        var raceOrder = await Order("One order two pharmacists", false, (raceMedicine, 5));
        await Pay(raceOrder);
        await Race(raceOrder, raceOrder, 5);
        check(await db.DispenseDetails.Where(x => x.PrescriptionDetail.PrescriptionId == raceOrder.PrescriptionId)
            .SumAsync(x => x.QuantityDispensed) == 5, "D8 the raced prescription has exactly its prescribed quantity in history");
        var shared = await Medicine("Two orders share stock", ("SHARED", 7, 9));
        var left = await Order("Shared left", false, (shared, 5));
        var right = await Order("Shared right", false, (shared, 5));
        await Pay(left);
        await Pay(right);
        await Race(left, right, 5);
        check(await db.DispenseDetails.Where(x => x.Inventory.MedicineId == shared.MedicineId)
            .SumAsync(x => x.QuantityDispensed) == 5, "D8 a losing order leaves no partial dispensing rows");

        var shortage = await Medicine("Rollback shortage", ("SHORT", 1, 6));
        var shortOrder = await Order("All or nothing", false, (second, 2), (shortage, 3));
        await Pay(shortOrder);
        await Login(pharmacist.Username);
        var beforeShortage = await Stock();
        await Send(HttpMethod.Post, $"api/dispensing/{shortOrder.PrescriptionId}/confirm", status: 409, code: 7405);
        check(beforeShortage == await Stock() && !await db.DispenseDetails.AnyAsync(x => x.PrescriptionDetail.PrescriptionId == shortOrder.PrescriptionId),
            "D8 a shortage in the last medicine rolls back the whole handover");
        var shortDetail = await Detail(shortOrder);
        var reviewed = await Send(HttpMethod.Post, $"api/dispensing/{shortOrder.PrescriptionId}/stock-reviews", new
        {
            note = "D8 review this shortage", expectedUpdatedAt = shortDetail["updatedAt"]!.GetValue<string>()
        });
        await db.Inventory.Where(x => x.MedicineId == shortage.MedicineId)
            .ExecuteUpdateAsync(x => x.SetProperty(i => i.QuantityInStock, 10));
        check(!(await Detail(shortOrder))["canDispense"]!.GetValue<bool>(),
            "D8 replenishment plus Paid cannot bypass an open review");
        await Send(HttpMethod.Post, $"api/dispensing/{shortOrder.PrescriptionId}/confirm", status: 409, code: 7410);
        var reviewId = reviewed["reviews"]![0]!["reviewId"]!.GetValue<int>();
        await Login("testdoctor");
        var review = await Send(HttpMethod.Get, $"api/stock-reviews/{reviewId}");
        await Send(HttpMethod.Post, $"api/stock-reviews/{reviewId}/responses", new
        {
            action = "KeepPrescription", reason = "D8 stock has been replenished",
            expectedReviewUpdatedAt = review["review"]!["updatedAt"]!.GetValue<string>(),
            expectedPrescriptionUpdatedAt = review["prescriptionUpdatedAt"]!.GetValue<string>()
        });
        await Login(pharmacist.Username);
        var recheck = await Detail(shortOrder);
        var rechecked = await Send(HttpMethod.Post, $"api/dispensing/{shortOrder.PrescriptionId}/stock-reviews/recheck", new
        {
            expectedReviewId = reviewId,
            expectedReviewUpdatedAt = recheck["reviews"]![0]!["updatedAt"]!.GetValue<string>(),
            expectedPrescriptionUpdatedAt = recheck["updatedAt"]!.GetValue<string>()
        });
        check(rechecked["canDispense"]!.GetValue<bool>() && rechecked["reviews"]![0]!["status"]!.GetValue<string>() == "Resolved",
            "D8 doctor response and pharmacy recheck unlock an already paid sufficient order without dispensing it");
        var expires = await Medicine("Expiry changed after preview", ("PREVIEW", 5, 1));
        var expiredOrder = await Order("Revalidate expiry", false, (expires, 3));
        await Pay(expiredOrder);
        await Login(pharmacist.Username);
        check((await Detail(expiredOrder))["canDispense"]!.GetValue<bool>(), "D8 a preview is eligible before the lot expires");
        await db.Inventory.Where(x => x.MedicineId == expires.MedicineId).ExecuteUpdateAsync(x => x.SetProperty(i => i.ExpiryDate, today.AddDays(-1)));
        var beforeExpiry = await Stock();
        await Send(HttpMethod.Post, $"api/dispensing/{expiredOrder.PrescriptionId}/confirm", status: 409, code: 7405);
        check(beforeExpiry == await Stock(), "D8 confirmation re-reads expiry instead of trusting a stale FEFO preview");

        var uiMedicine = await Medicine("UI integration", ("UI-EARLY", 4, 10), ("UI-LATER", 8, 20));
        var uiOrder = await Order("UI patient", false, (uiMedicine, 6));
        return new(uiOrder.PrescriptionId, uiOrder.MedicalRecord.AppointmentId, uiOrder.MedicalRecordId,
            PatientId(uiOrder), uiMedicine.MedicineId, uiOrder.Details.Single().PrescriptionDetailId, expiredOrder.PrescriptionId);
    }
}

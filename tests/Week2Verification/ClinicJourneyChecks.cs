using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Helpers;
using Microsoft.EntityFrameworkCore;

internal static class ClinicJourneyChecks
{
    internal record Gap(string Id, string Owner, string Observed, string Required);
    internal record Journey(string Branch, int AppointmentId, int PatientProfileId, int? UserId,
        int MedicalRecordId, int PrescriptionId, int InvoiceId, int? LabTestId, string BookNumber);
    internal record ClinicalUiCase(string Branch, int AppointmentId, int PatientProfileId,
        int PatientBookId, string BookNumber, string PatientName, int DiseaseId, string DiseaseLabel,
        int MedicineId, string MedicineName, int AvailableQuantity, int SecondaryMedicineId,
        string SecondaryMedicineName, int SecondaryAvailableQuantity);
    internal record Report(IReadOnlyList<Journey> Journeys, IReadOnlyList<Gap> Gaps);

    public static async Task<IReadOnlyList<ClinicalUiCase>> PrepareClinicalUiAsync(
        ApplicationDbContext db, Action<bool, string> check)
    {
        var database = db.Database.GetDbConnection().Database;
        if (!database.StartsWith("ClinicWeek2Test_", StringComparison.Ordinal)
            || !Guid.TryParseExact(database["ClinicWeek2Test_".Length..], "N", out _))
            throw new InvalidOperationException("Clinical UI fixtures only run in a random verification database.");
        var hash = await db.Users.Where(x => x.Username == "testadmin").Select(x => x.PasswordHash).SingleAsync();
        var pharmacy = await db.Users.SingleOrDefaultAsync(x => x.Username == "d9pharmacist");
        if (pharmacy == null)
        {
            pharmacy = new User { Username = "d9pharmacist", FullName = "D9 UI Pharmacist", PasswordHash = hash,
                RoleId = await db.Roles.Where(x => x.RoleName == RoleConstants.Pharmacist).Select(x => x.RoleId).SingleAsync() };
            db.Users.Add(pharmacy);
        }
        var account = new User { Username = "d9uipatient", FullName = "D9 UI Web Patient", PasswordHash = hash,
            RoleId = await db.Roles.Where(x => x.RoleName == RoleConstants.Patient).Select(x => x.RoleId).SingleAsync() };
        db.Users.Add(account);
        var category = await db.MedicineCategories.Select(x => x.CategoryId).FirstAsync();
        var supplier = await db.Suppliers.Select(x => x.SupplierId).FirstAsync();
        var primary = new Medicine { MedicineName = "D9 UI primary medicine", Unit = "Vien", UnitPrice = 1000m,
            CategoryId = category, SupplierId = supplier };
        var secondary = new Medicine { MedicineName = "D9 UI second medicine", Unit = "Vien", UnitPrice = 2000m,
            CategoryId = category, SupplierId = supplier };
        var today = ClinicClock.Today;
        db.Inventory.AddRange(
            new Inventory { Medicine = primary, BatchNumber = "D9-UI-PRIMARY", ExpiryDate = today.AddDays(10), QuantityInStock = 12 },
            new Inventory { Medicine = secondary, BatchNumber = "D9-UI-SECOND", ExpiryDate = today.AddDays(20), QuantityInStock = 20 });
        await db.SaveChangesAsync();
        var disease = await db.Diseases.AsNoTracking().FirstAsync(x => x.IsActive);
        var cases = new List<ClinicalUiCase>();
        for (var i = 0; i < 2; i++)
        {
            var branch = i == 0 ? "web" : "walk-in";
            // Reception is a prepared prerequisite here, not evidence of a receptionist UI journey.
            var profile = new Patient { FullName = i == 0 ? account.FullName : "D9 UI Walk In Patient",
                Phone = i == 0 ? "0900999011" : "0900999012", UserId = i == 0 ? account.UserId : null,
                CreatedAt = DateTime.UtcNow };
            var book = new PatientBook { Patient = profile, BookNumber = "D9-UI-" + branch + "-BOOK",
                Status = "Issued", IssuedAt = DateTime.UtcNow };
            var appointment = new Appointment { DoctorId = 1, PatientProfile = profile, PatientBook = book,
                PatientId = profile.UserId, PatientName = profile.FullName, PatientPhone = profile.Phone,
                AppointmentDate = today.ToDateTime(TimeOnly.MinValue), StartTime = TimeSpan.FromHours(8 + i),
                EndTime = TimeSpan.FromHours(8.5 + i), Status = "InProgress", CheckedInAt = DateTime.UtcNow,
                BookVerifiedAt = DateTime.UtcNow, Reason = "D9 owned clinical UI " + branch, CreatedAt = DateTime.UtcNow };
            db.Appointments.Add(appointment);
            await db.SaveChangesAsync();
            check(!await db.MedicalRecords.AnyAsync(x => x.AppointmentId == appointment.AppointmentId),
                $"D9 {branch} clinical UI fixture starts with no record or prescription, and no medicine payment");
            cases.Add(new(branch, appointment.AppointmentId, profile.PatientId, book.PatientBookId,
                book.BookNumber, profile.FullName, disease.DiseaseId, $"{disease.DiseaseCode} - {disease.DiseaseName}",
                primary.MedicineId, primary.MedicineName, 12, secondary.MedicineId, secondary.MedicineName, 20));
        }
        return cases;
    }

    public static async Task<Report> RunAsync(HttpClient client, ApplicationDbContext db,
        string password, Action<bool, string> check)
    {
        // This guard must precede every fixture write, including when called outside Program.cs.
        var database = db.Database.GetDbConnection().Database;
        if (!database.StartsWith("ClinicWeek2Test_", StringComparison.Ordinal)
            || !Guid.TryParseExact(database["ClinicWeek2Test_".Length..], "N", out _))
            throw new InvalidOperationException("D9 only runs against a randomly named verification database.");

        var today = ClinicClock.Today;
        var now = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Asia/Ho_Chi_Minh");
        var firstSlot = TimeSpan.FromMinutes((Math.Floor(now.TimeOfDay.TotalMinutes / 30) + 1) * 30);
        if (firstSlot + TimeSpan.FromHours(1) >= TimeSpan.FromDays(1))
            throw new InvalidOperationException("D9 needs two future slots today; rerun before 23:00 clinic time.");

        var gaps = new List<Gap>();
        void Block(string id, string owner, string observed, string required)
        {
            if (gaps.Any(x => x.Id == id)) return;
            gaps.Add(new Gap(id, owner, observed, required));
            Console.WriteLine($"BLOCKED {id} [{owner}]: {observed}");
        }

        var hash = await db.Users.Where(x => x.Username == "testadmin").Select(x => x.PasswordHash).SingleAsync();
        async Task<User> Staff(string username, string roleName)
        {
            var role = await db.Roles.SingleOrDefaultAsync(x => x.RoleName == roleName);
            if (role == null)
            {
                role = new Role { RoleName = roleName, Description = "D9 test only", IsSystem = true };
                db.Roles.Add(role);
                await db.SaveChangesAsync();
            }
            var user = new User { Username = username, FullName = username, RoleId = role.RoleId, PasswordHash = hash };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return user;
        }
        var cashier = await Staff("d9cashier", RoleConstants.Cashier);
        var pharmacist = await Staff("d9pharmacist", RoleConstants.Pharmacist);

        // Seed only prerequisites. Appointments, books, records, invoices and handovers use HTTP.
        var schedule = new DoctorSchedule { DoctorId = 1, RoomId = 1, WorkDate = today,
            StartTime = firstSlot, EndTime = firstSlot + TimeSpan.FromHours(1), MaxPatients = 2, Status = "Approved" };
        for (var i = 0; i < 2; i++)
            schedule.TimeSlots.Add(new TimeSlot { StartTime = firstSlot + TimeSpan.FromMinutes(30 * i),
                EndTime = firstSlot + TimeSpan.FromMinutes(30 * (i + 1)), MaxCapacity = 1, IsAvailable = true });
        var medicine = new Medicine { MedicineName = "D9 journey medicine", Unit = "Vien", UnitPrice = 1000m,
            CategoryId = await db.MedicineCategories.Select(x => x.CategoryId).FirstAsync(),
            SupplierId = await db.Suppliers.Select(x => x.SupplierId).FirstAsync() };
        db.DoctorSchedules.Add(schedule);
        db.Inventory.AddRange(
            new Inventory { Medicine = medicine, BatchNumber = "D9-EARLY", ExpiryDate = today.AddDays(10), QuantityInStock = 4 },
            new Inventory { Medicine = medicine, BatchNumber = "D9-LATER", ExpiryDate = today.AddDays(20), QuantityInStock = 20 },
            new Inventory { Medicine = medicine, BatchNumber = "D9-EXPIRED", ExpiryDate = today.AddDays(-1), QuantityInStock = 50 });
        var labType = new LabTestType { Name = "D9 journey lab", Price = 25000m };
        db.LabTestTypes.Add(labType);
        await db.SaveChangesAsync();
        var diseaseId = await db.Diseases.Select(x => x.DiseaseId).FirstAsync();
        string? token = null;

        async Task<(int Status, JsonNode? Body)> Request(HttpMethod method, string path, object? body = null)
        {
            using var request = new HttpRequestMessage(method, path);
            if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            return ((int)response.StatusCode, string.IsNullOrWhiteSpace(text) ? null : JsonNode.Parse(text));
        }
        async Task<JsonNode> Send(HttpMethod method, string path, object? body = null, int status = 200)
        {
            var response = await Request(method, path, body);
            check(response.Status == status, $"D9 {method} {path}: expected {status}, got {response.Status}"
                + (response.Status == status ? "" : " " + response.Body?.ToJsonString()));
            return response.Body is JsonObject envelope && envelope.ContainsKey("code") && envelope.ContainsKey("result")
                ? envelope["result"]! : response.Body!;
        }
        async Task Login(string username)
        {
            token = null;
            token = (await Send(HttpMethod.Post, "api/auth/login", new { username, password }))["accessToken"]!.GetValue<string>();
        }
        async Task<string> Stock() => JsonSerializer.Serialize(await db.Inventory.AsNoTracking()
            .OrderBy(x => x.InventoryId).Select(x => new { x.InventoryId, x.QuantityInStock }).ToArrayAsync());
        object Item(string source, int sourceId, string name, int quantity, decimal price) =>
            new { sourceType = source, sourceId, itemName = name, quantity, unitPrice = price };
        async Task<JsonNode> Pay(int appointmentId, int patientId, string stage, params object[] items)
        {
            await Login(cashier.Username);
            var stock = await Stock();
            var invoice = await Send(HttpMethod.Post, "api/Invoices", new
            {
                appointmentId, patientId, billingStage = stage, paymentMethod = "Cash", items
            });
            check(invoice["status"]!.GetValue<string>() == "Paid" && stock == await Stock(),
                $"D9 actual {stage} cashier API records payment without deducting inventory");
            return invoice;
        }

        await Send(HttpMethod.Post, "api/auth/register", new
        {
            username = "d9patient", fullName = "D9 Web Patient", password
        });
        var patientUserId = await db.Users.Where(x => x.Username == "d9patient").Select(x => x.UserId).SingleAsync();
        var baselineStock = await Stock();
        var journeys = new List<Journey>();

        foreach (var branch in new[] { "web", "walk-in" })
        {
            var web = branch == "web";
            var name = web ? "D9 Web Patient" : "D9 Walk In Patient";
            var phone = web ? "0900999001" : "0900999002";
            var bookNumber = web ? "D9-WEB-BOOK" : "D9-WALKIN-BOOK";
            await Login(web ? "d9patient" : "testreceptionist");
            var appointment = await Send(HttpMethod.Post, web ? "api/appointments" : "api/appointments/direct", new
            {
                doctorId = 1, appointmentDate = today.ToString("yyyy-MM-dd"),
                startTime = (firstSlot + TimeSpan.FromMinutes(web ? 0 : 30)).ToString("c"),
                patientName = name, patientPhone = phone, reason = "D9 " + branch + " journey"
            });
            var appointmentId = appointment["appointmentId"]!.GetValue<int>();
            check(appointment["status"]!.GetValue<string>() == (web ? "Pending" : "Confirmed")
                && appointment["checkedInAt"] == null, $"D9 {branch} enters reception without seeded check-in");

            await Login("testreceptionist");
            if (web)
            {
                await Send(HttpMethod.Patch, $"api/appointments/{appointmentId}/confirm");
                appointment = await Send(HttpMethod.Patch, $"api/appointments/{appointmentId}/patient-profile", new { });
            }
            var profileId = appointment["patientProfileId"]!.GetValue<int>();
            check(await db.Patients.AsNoTracking().AnyAsync(x => x.PatientId == profileId
                && x.UserId == (web ? patientUserId : (int?)null)),
                $"D9 {branch} preserves account/profile identity without creating a fake walk-in account");
            var billingPatientId = web ? patientUserId : profileId;
            await Login("testdoctor");
            await Send(HttpMethod.Patch, $"api/appointments/{appointmentId}/start-examination", status: 400);
            await Login("testreceptionist");
            int bookId;
            if (web)
            {
                var book = await Send(HttpMethod.Post, $"api/patients/{profileId}/books/existing", new
                {
                    bookNumber, bookPresented = true
                });
                bookId = book["patientBookId"]!.GetValue<int>();
                await Send(HttpMethod.Patch, $"api/appointments/{appointmentId}/check-in", new
                {
                    patientProfileId = profileId, patientBookId = bookId, bookPresented = false
                }, 400);
            }
            else
            {
                var bookInvoice = await Send(HttpMethod.Post, $"api/patients/{profileId}/book-invoices", new { amount = 15000 });
                var bookInvoiceId = bookInvoice["bookInvoiceId"]!.GetValue<int>();
                await Send(HttpMethod.Post, $"api/book-invoices/{bookInvoiceId}/issue-book", new { bookNumber }, 409);
                await Pay(appointmentId, profileId, "Book", Item("Book", bookInvoiceId, "D9 new book", 1, 15000m));
                await Login("testreceptionist");
                var book = await Send(HttpMethod.Post, $"api/book-invoices/{bookInvoiceId}/issue-book", new { bookNumber });
                bookId = book["patientBookId"]!.GetValue<int>();
            }
            appointment = await Send(HttpMethod.Patch, $"api/appointments/{appointmentId}/check-in", new
            {
                patientProfileId = profileId, patientBookId = bookId, bookPresented = true
            });
            check(appointment["checkedInAt"] != null && appointment["bookVerifiedAt"] != null
                && appointment["patientBookId"]!.GetValue<int>() == bookId, $"D9 {branch} checked in with its own Issued book");
            await Login("testdoctor");
            await Send(HttpMethod.Patch, $"api/appointments/{appointmentId}/start-examination");
            var record = await Send(HttpMethod.Post, "api/medical-records", new
            {
                appointmentId, patientBookId = bookId, symptoms = "D9 " + branch + " symptoms",
                conclusion = "D9 " + branch + " conclusion", diagnoses = new[] { new { diseaseId, isPrimary = true } }
            }, 201);
            var recordId = record["medicalRecordId"]!.GetValue<int>();
            check(record["patientProfileId"]!.GetValue<int>() == profileId && record["patientBookNumber"]!.GetValue<string>() == bookNumber,
                $"D9 {branch} record carries the reception profile and verified book");

            int? labId = null;
            if (web)
            {
                var lab = await Send(HttpMethod.Post, "api/LabTests", new
                {
                    patientId = patientUserId, labTestTypeId = labType.Id, clinicalDiagnosis = "D9 web clinical indication"
                });
                labId = lab["id"]!.GetValue<int>();
                await Login("testlab");
                check(!(await Send(HttpMethod.Get, "api/LabTests/pending")).AsArray()
                    .Any(x => x!["id"]!.GetValue<int>() == labId), "D9 unbilled lab is absent from the technician queue");
                await Pay(appointmentId, billingPatientId, "LabAndConsultation",
                    Item("LabTest", labId.Value, labType.Name, 1, labType.Price),
                    Item("Appointment", appointmentId, "D9 consultation", 1, 150000m));
                await Login("testlab");
                check((await Send(HttpMethod.Get, "api/LabTests/pending")).AsArray()
                    .Any(x => x!["id"]!.GetValue<int>() == labId), "D9 paid lab enters the technician queue");
                await Send(HttpMethod.Post, "api/LabTests/results", new
                {
                    labTestId = labId, resultSummary = "D9 verified lab result", note = "D9 web result"
                });
                await Login("testdoctor");
                lab = await Send(HttpMethod.Get, $"api/LabTests/{labId}");
                check(lab["status"]!.GetValue<string>() == "Completed"
                    && lab["result"]!["resultSummary"]!.GetValue<string>() == "D9 verified lab result",
                    "D9 ordering doctor reads the technician result before finalizing the prescription");
                Block("LAB_VISIT_BINDING", "Lab/Billing", "LabTest uses a patient UserId; the current API carries no appointment/record binding.",
                    "Bind indication, result and invoice sources to the same visit before full multi-visit acceptance.");
            }
            else
            {
                var labCount = await db.LabTests.CountAsync();
                var probe = await Request(HttpMethod.Post, "api/LabTests", new
                {
                    patientId = profileId, labTestTypeId = labType.Id, clinicalDiagnosis = "D9 walk-in compatibility probe"
                });
                Block("WALKIN_LAB_IDENTITY", "Lab", $"Walk-in profile without an account: lab order returned HTTP {probe.Status}.",
                    "Support canonical walk-in PatientProfileId without creating a patient login or attaching another user's lab.");
                check(probe.Status == 404 && labCount == await db.LabTests.CountAsync(),
                    "D9 current walk-in lab rejection leaves no incorrectly linked lab row (dependency, not a completed lab journey)");
            }

            await Login("testdoctor");
            var beforePrescription = await Stock();
            var rx = await Send(HttpMethod.Post, "api/prescriptions", new
            {
                medicalRecordId = recordId, notes = "D9 " + branch + " final advice",
                details = new[] { new { medicineId = medicine.MedicineId, quantity = 6,
                    dosage = "One twice daily", instructions = "After meals for three days" } }
            }, 201);
            var prescriptionId = rx["prescriptionId"]!.GetValue<int>();
            var detailId = rx["details"]![0]!["prescriptionDetailId"]!.GetValue<int>();
            check(beforePrescription == await Stock(), $"D9 {branch} final prescription does not deduct stock");
            record = await Send(HttpMethod.Get, $"api/medical-records/{recordId}");
            object Complete(bool confirmed) => new
            {
                expectedUpdatedAt = record["updatedAt"]!.GetValue<string>(), patientBookId = bookId,
                symptoms = "D9 " + branch + " symptoms", conclusion = "D9 " + branch + " conclusion",
                diagnoses = new[] { new { diseaseId, isPrimary = true } }, markCompleted = true, paperBookConfirmed = confirmed
            };
            await Send(HttpMethod.Put, $"api/medical-records/{recordId}", Complete(false), 400);
            record = await Send(HttpMethod.Put, $"api/medical-records/{recordId}", Complete(true));
            check(record["status"]!.GetValue<string>() == "Completed" && record["paperBookUpdatedAt"] != null
                && record["patientBookId"]!.GetValue<int>() == bookId && beforePrescription == await Stock(),
                $"D9 {branch} completion records paper-book declaration but does not imply payment or handover");

            await Login(pharmacist.Username);
            var detail = await Send(HttpMethod.Get, $"api/dispensing/{prescriptionId}");
            check(!detail["canDispense"]!.GetValue<bool>() && detail["workflowStatus"]!.GetValue<string>() == "AwaitingPayment",
                $"D9 {branch} Book/Lab payment cannot authorize medicine handover");
            await Send(HttpMethod.Post, $"api/dispensing/{prescriptionId}/confirm", status: 409);
            await Login(cashier.Username);
            var stage = web ? "Medicine" : "Final";
            var pending = await Send(HttpMethod.Get, $"api/Invoices/pending?stage={stage}");
            if (!pending.AsArray().Any(x => x!["appointmentId"]!.GetValue<int>() == appointmentId))
                Block("MEDICINE_FINAL_QUEUE", "Billing", "Medicine/Final pending API does not return the completed unpaid visit.",
                    "Generate the cashier queue and expose medicine/final collection in the cashier UI.");
            var items = new List<object> { Item("PrescriptionDetail", detailId, medicine.MedicineName, 6, medicine.UnitPrice) };
            if (!web) items.Add(Item("Appointment", appointmentId, "D9 consultation", 1, 150000m));
            var paid = await Pay(appointmentId, billingPatientId, stage, items.ToArray());
            var invoiceId = paid["id"]!.GetValue<int>();
            var sourcesBefore = await db.InvoiceDetails.AsNoTracking().Where(x => x.InvoiceId == invoiceId)
                .OrderBy(x => x.Id).Select(x => new { x.Id, x.SourceType, x.SourceId, x.Quantity, x.TotalPrice }).ToArrayAsync();
            await Login(pharmacist.Username);
            detail = await Send(HttpMethod.Get, $"api/dispensing/{prescriptionId}");
            check(detail["canDispense"]!.GetValue<bool>() && detail["invoiceId"]!.GetValue<int>() == invoiceId,
                $"D9 {branch} actual {stage} payment unlocks only its matching prescription");
            var lots = detail["medicines"]![0]!["allocations"]!.AsArray();
            check(lots.Sum(x => x!["quantityAllocated"]!.GetValue<int>()) == 6,
                $"D9 {branch} FEFO preview covers the full prescription");
            var dispensed = await Send(HttpMethod.Post, $"api/dispensing/{prescriptionId}/confirm");
            check(dispensed["prescriptionStatus"]!.GetValue<string>() == "Dispensed"
                && dispensed["dispensedByUserId"]!.GetValue<int>() == pharmacist.UserId && dispensed["dispensedAt"] != null,
                $"D9 {branch} physical handover records pharmacist/time and Dispensed status");
            var rows = await db.DispenseDetails.AsNoTracking().Include(x => x.Inventory)
                .Where(x => x.PrescriptionDetail.PrescriptionId == prescriptionId).ToListAsync();
            check(rows.Sum(x => x.QuantityDispensed) == 6 && rows.All(x => x.Inventory.MedicineId == medicine.MedicineId
                && x.Inventory.ExpiryDate >= today), $"D9 {branch} handover persists exact valid-lot traceability");
            check(rows.OrderBy(x => x.InventoryId).Select(x => (x.InventoryId, x.QuantityDispensed)).SequenceEqual(
                lots.Select(x => (x!["inventoryId"]!.GetValue<int>(), x["quantityAllocated"]!.GetValue<int>())).OrderBy(x => x.Item1)),
                $"D9 {branch} actual lot deductions match the FEFO allocation shown before handover");
            var after = await Stock();
            await Send(HttpMethod.Post, $"api/dispensing/{prescriptionId}/confirm", status: 400);
            check(after == await Stock(), $"D9 {branch} repeated handover never deducts twice");
            check(sourcesBefore.SequenceEqual(await db.InvoiceDetails.AsNoTracking().Where(x => x.InvoiceId == invoiceId)
                .OrderBy(x => x.Id).Select(x => new { x.Id, x.SourceType, x.SourceId, x.Quantity, x.TotalPrice }).ToArrayAsync()),
                $"D9 {branch} pharmacy leaves billing sources and amounts unchanged");
            await Login("testdoctor");
            var history = await Send(HttpMethod.Get, $"api/medical-records/by-appointment/{appointmentId}/history/{recordId}");
            check(history["record"]!["patientBookNumber"]!.GetValue<string>() == bookNumber
                && history["prescription"]!["prescriptionCode"]!.GetValue<string>() == $"RX-{prescriptionId:D5}",
                $"D9 {branch} completed history retains the same book and dispensed prescription");
            journeys.Add(new(branch, appointmentId, profileId, web ? patientUserId : null,
                recordId, prescriptionId, invoiceId, labId, bookNumber));
        }

        check(baselineStock != await Stock(), "D9 only physical handovers changed the stock baseline");
        var balances = await db.Inventory.AsNoTracking().Where(x => x.MedicineId == medicine.MedicineId)
            .ToDictionaryAsync(x => x.BatchNumber, x => x.QuantityInStock);
        check(balances["D9-EARLY"] == 0 && balances["D9-LATER"] == 12 && balances["D9-EXPIRED"] == 50,
            "D9 both journeys consume 12 tablets by FEFO and never consume expired inventory");
        check(await db.InvoiceDetails.CountAsync(x => x.SourceType == "Appointment"
            && journeys.Select(j => j.AppointmentId).Contains(x.SourceId)) == 2,
            "D9 consultation sources are charged once per visit, not again with Medicine");
        await Login("d9patient");
        var own = await Send(HttpMethod.Get, $"api/medical-records/me/history/{journeys[0].MedicalRecordId}");
        check(own["record"]!["patientBookNumber"]!.GetValue<string>() == journeys[0].BookNumber
            && own["prescription"]!["status"]!.GetValue<string>() == "Dispensed",
            "D9 web patient portal shows the same finalized paper book and dispensed prescription");
        await Send(HttpMethod.Get, $"api/medical-records/me/history/{journeys[1].MedicalRecordId}", status: 404);
        var ownLab = await Send(HttpMethod.Get, $"api/LabTests/{journeys[0].LabTestId}");
        check(ownLab["result"]!["resultSummary"]!.GetValue<string>() == "D9 verified lab result",
            "D9 web patient sees their own persisted lab result");

        // Probe a separate order so a known Lab payment-guard defect cannot be mistaken for happy-path evidence.
        await Login("testdoctor");
        var unbilledLab = await Send(HttpMethod.Post, "api/LabTests", new
        {
            patientId = patientUserId, labTestTypeId = labType.Id, clinicalDiagnosis = "D9 unpaid direct-call probe"
        });
        var unbilledId = unbilledLab["id"]!.GetValue<int>();
        await Login("testlab");
        var unpaidResult = await Request(HttpMethod.Post, "api/LabTests/results", new
        {
            labTestId = unbilledId, resultSummary = "D9 dependency probe, not a paid result"
        });
        if (unpaidResult.Status == 200)
            Block("LAB_RESULT_PAYMENT_GUARD", "Lab/Billing", "Technician result API accepts an unbilled order by direct POST.",
                "Enforce matching LabAndConsultation Paid evidence in the result API, not just the pending queue.");
        else
            check(unpaidResult.Status is 400 or 403 or 409
                && !await db.LabTestResults.AnyAsync(x => x.LabTestId == unbilledId),
                "D9 direct unpaid lab result is rejected without a result row");

        return new(journeys, gaps);
    }
}

using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Mappings;
using Microsoft.EntityFrameworkCore;

internal static class MedicalHistoryChecks
{
    public static async Task VerifyDemoSeedProfilesAsync(
        HttpClient client, ApplicationDbContext db, string root, Action<bool, string> check)
    {
        var seedDirectory = Path.Combine(root, "backend/ClinicManagement/Data/Seed");
        var seed = await File.ReadAllTextAsync(Path.Combine(seedDirectory, "clinic-all-tables-demo.sql"));
        var migrations = (await db.Database.GetAppliedMigrationsAsync()).ToArray();
        db.Notifications.Add(new Notification
        {
            UserId = await db.Users.Select(x => x.UserId).FirstAsync(),
            EventKey = "seed-reset-existing-user", Title = "Reset seed regression",
            Content = "Existing notification must not block deleting its user.", Type = "Pharmacy"
        });
        await db.SaveChangesAsync();
        check(await db.Notifications.AnyAsync(), "Reset seed fixture contains notifications referencing existing users");
        await db.Database.ExecuteSqlRawAsync(seed);
        db.ChangeTracker.Clear();
        check(!await db.Notifications.AnyAsync(), "Reset seed removes old notifications before replacing users");
        var firstVersion = await db.Users.Where(x => x.Username == "admin").Select(x => x.SecurityVersion).SingleAsync();
        db.Notifications.AddRange(
            new Notification { UserId = 1002, EventKey = "seed-reset-doctor", Title = "Doctor notification",
                Content = "Read notification", Type = "Pharmacy", IsRead = true },
            new Notification { UserId = 1006, EventKey = "seed-reset-patient", Title = "Patient notification",
                Content = "Unread notification", Type = "Appointment" });
        await db.SaveChangesAsync();
        await db.Database.ExecuteSqlRawAsync(seed);
        db.ChangeTracker.Clear();
        check(!await db.Notifications.AnyAsync() && await db.Users.CountAsync() == 21
            && await db.Users.Where(x => x.Username == "admin").Select(x => x.SecurityVersion).SingleAsync() == firstVersion + 1,
            "Reset seed reruns with read/unread notifications and recreates versioned demo accounts");
        check(migrations.SequenceEqual(await db.Database.GetAppliedMigrationsAsync()),
            "Reset seed preserves migration history across notification cleanup and repeated resets");
        var demoAccounts = await db.Users.AsNoTracking()
            .Where(x => x.Role.RoleName == "Patient").OrderBy(x => x.UserId)
            .Select(x => new { x.UserId, x.Username }).ToListAsync();
        check(demoAccounts.Count == 16 && await db.Patients.CountAsync(x => x.UserId != null) == 16
            && !await db.Users.AnyAsync(x => x.Role.RoleName == "Patient"
                && !db.Patients.Any(p => p.UserId == x.UserId)),
            "D6 reset seed creates linked profiles for all demo patient accounts");

        async Task VerifyAllAccounts(string phase)
        {
            foreach (var account in demoAccounts)
            {
                var profile = await db.Patients.AsNoTracking().SingleAsync(x => x.UserId == account.UserId);
                var expectedIds = await db.MedicalRecords.AsNoTracking()
                    .Where(x => x.PatientId == account.UserId && x.Appointment.Status == "Completed")
                    .OrderBy(x => x.MedicalRecordId).Select(x => x.MedicalRecordId).ToArrayAsync();
                using var login = await client.PostAsJsonAsync("api/auth/login",
                    new { username = account.Username, password = "admin123" });
                var auth = (await login.Content.ReadFromJsonAsync<JsonNode>())?["result"];
                check(login.IsSuccessStatusCode && auth?["userId"]?.GetValue<int>() == account.UserId,
                    $"D6 {phase}: {account.Username} logs in as its own account");
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
                    "Bearer", auth!["accessToken"]!.GetValue<string>());

                using var summaryResponse = await client.GetAsync("api/medical-records/me/history/summary");
                var summary = (await summaryResponse.Content.ReadFromJsonAsync<JsonNode>())?["result"];
                check(summaryResponse.IsSuccessStatusCode
                    && summary?["patientCode"]?.GetValue<string>() == $"BN-{profile.PatientId:D5}"
                    && summary?["patientName"]?.GetValue<string>() == profile.FullName
                    && summary?["patientPhone"]?.GetValue<string>() == profile.Phone
                    && summary?["totalCompletedVisits"]?.GetValue<int>() == expectedIds.Length,
                    $"D6 {phase}: {account.Username} resolves its own profile and visit count");

                using var response = await client.GetAsync("api/medical-records/me/history?pageSize=100");
                var history = (await response.Content.ReadFromJsonAsync<JsonNode>())?["result"];
                var actualIds = history?["items"]?.AsArray()
                    .Select(x => x!["medicalRecordId"]!.GetValue<int>()).OrderBy(x => x).ToArray();
                check(response.IsSuccessStatusCode && actualIds != null && actualIds.SequenceEqual(expectedIds),
                    $"D6 {phase}: {account.Username} sees all and only its completed seeded visits");
                foreach (var recordId in expectedIds)
                {
                    using var detailResponse = await client.GetAsync($"api/medical-records/me/history/{recordId}");
                    var detail = (await detailResponse.Content.ReadFromJsonAsync<JsonNode>())?["result"];
                    check(detailResponse.IsSuccessStatusCode
                        && detail?["patientCode"]?.GetValue<string>() == $"BN-{profile.PatientId:D5}"
                        && detail?["record"]?["medicalRecordId"]?.GetValue<int>() == recordId,
                        $"D6 {phase}: {account.Username} opens its own seeded record {recordId}");
                }
            }
        }
        await VerifyAllAccounts("fresh seed");
        await VerifyDemoBillingSeedAsync(client, db, seedDirectory, check);

        // Recreate the old seed's missing profiles and missing account links on this temporary DB.
        await db.Patients.Where(x => x.PatientId < 1006 || x.PatientId > 1009).ExecuteDeleteAsync();
        await db.Patients.ExecuteUpdateAsync(update => update.SetProperty(x => x.UserId, (int?)null));
        var recordCount = await db.MedicalRecords.CountAsync();
        var bookCount = await db.PatientBooks.CountAsync();
        var prescriptionCount = await db.Prescriptions.CountAsync();
        var repair = await File.ReadAllTextAsync(Path.Combine(seedDirectory, "clinic-demo-patient-profiles-compat.sql"));
        await db.Database.ExecuteSqlRawAsync(repair);
        await db.Database.ExecuteSqlRawAsync(repair);
        check(await db.Patients.CountAsync() == 16 && await db.Patients.CountAsync(x => x.UserId != null) == 16,
            "D6 non-destructive repair links existing profiles and creates missing demo profiles without duplication");
        check(await db.MedicalRecords.CountAsync() == recordCount && await db.PatientBooks.CountAsync() == bookCount
            && await db.Prescriptions.CountAsync() == prescriptionCount,
            "D6 demo profile repair preserves existing books, records and prescriptions");
        await VerifyAllAccounts("repaired old seed");
        client.DefaultRequestHeaders.Authorization = null;
    }

    private static async Task VerifyDemoBillingSeedAsync(
        HttpClient client, ApplicationDbContext db, string seedDirectory, Action<bool, string> check)
    {
        var script = await File.ReadAllTextAsync(Path.Combine(seedDirectory, "clinic-demo-medical-history-billing.sql"));
        var inventory = await db.Inventory.AsNoTracking().OrderBy(x => x.InventoryId)
            .Select(x => new { x.InventoryId, x.QuantityInStock, x.BatchNumber, x.ExpiryDate }).ToListAsync();
        var records = await db.MedicalRecords.AsNoTracking().OrderBy(x => x.MedicalRecordId)
            .Select(x => new { x.MedicalRecordId, x.Symptoms, x.Conclusion, x.UpdatedAt, x.Appointment.Status }).ToListAsync();
        var invoices = await db.Invoices.AsNoTracking().OrderBy(x => x.Id)
            .Select(x => new { x.Id, x.TotalAmount, x.PatientAmount, x.InsuranceAmount, x.Status }).ToListAsync();
        var prescriptions = await db.Prescriptions.AsNoTracking().OrderBy(x => x.PrescriptionId)
            .Select(x => new { x.PrescriptionId, x.Status, x.Notes, x.UpdatedAt, x.DispensedAt }).ToListAsync();
        var prescriptionCount = await db.Prescriptions.CountAsync();
        var invoiceCount = await db.Invoices.CountAsync();
        await db.Database.ExecuteSqlRawAsync(script);
        await db.Database.ExecuteSqlRawAsync(script);
        check(await db.Prescriptions.CountAsync() == prescriptionCount + 3
            && await db.Invoices.CountAsync() == invoiceCount + 3,
            "D6 optional billing seed adds three completed-visit fixtures without duplicates on rerun");
        check(inventory.SequenceEqual(await db.Inventory.AsNoTracking().OrderBy(x => x.InventoryId)
                .Select(x => new { x.InventoryId, x.QuantityInStock, x.BatchNumber, x.ExpiryDate }).ToListAsync())
            && records.SequenceEqual(await db.MedicalRecords.AsNoTracking().OrderBy(x => x.MedicalRecordId)
                .Select(x => new { x.MedicalRecordId, x.Symptoms, x.Conclusion, x.UpdatedAt, x.Appointment.Status }).ToListAsync()),
            "D6 optional billing seed preserves stock, clinical content and visit status");
        var invoiceIds = invoices.Select(x => x.Id).ToArray();
        var prescriptionIds = prescriptions.Select(x => x.PrescriptionId).ToArray();
        check(invoices.SequenceEqual(await db.Invoices.AsNoTracking().Where(x => invoiceIds.Contains(x.Id)).OrderBy(x => x.Id)
                .Select(x => new { x.Id, x.TotalAmount, x.PatientAmount, x.InsuranceAmount, x.Status }).ToListAsync())
            && prescriptions.SequenceEqual(await db.Prescriptions.AsNoTracking()
                .Where(x => prescriptionIds.Contains(x.PrescriptionId)).OrderBy(x => x.PrescriptionId)
                .Select(x => new { x.PrescriptionId, x.Status, x.Notes, x.UpdatedAt, x.DispensedAt }).ToListAsync()),
            "D6 optional billing seed never overwrites existing invoices or prescriptions");

        foreach (var (username, recordId, status, medicineAmount, totalAmount, insuranceAmount) in new[]
        {
            ("demo_patient04", 1001, "Paid", 175000m, 275000m, 55000m),
            ("demo_patient06", 1002, "Paid", 210000m, 210000m, 0m),
            ("demo_patient09", 1022, "Unpaid", 122500m, 222500m, 0m),
        })
        {
            using var login = await client.PostAsJsonAsync("api/auth/login", new { username, password = "admin123" });
            var auth = (await login.Content.ReadFromJsonAsync<JsonNode>())!["result"]!;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth["accessToken"]!.GetValue<string>());
            using var response = await client.GetAsync($"api/medical-records/me/history/{recordId}");
            var billing = (await response.Content.ReadFromJsonAsync<JsonNode>())?["result"]?["medicineBilling"];
            var invoice = billing?["invoices"]?.AsArray().Single();
            check(response.IsSuccessStatusCode && billing?["totalMedicineAmount"]?.GetValue<decimal>() == medicineAmount
                && invoice?["status"]?.GetValue<string>() == status
                && invoice?["totalAmount"]?.GetValue<decimal>() == totalAmount
                && invoice?["insuranceAmount"]?.GetValue<decimal>() == insuranceAmount
                && invoice?["patientAmount"]?.GetValue<decimal>() == totalAmount - insuranceAmount,
                $"D6 billing fixture for {username} exposes its own costs, status and consistent insurance split");
        }

        var appointment = await db.Appointments.SingleAsync(x => x.AppointmentId == 1025);
        appointment.Status = "Completed";
        var current = new MedicalRecord { AppointmentId = appointment.AppointmentId, DoctorId = appointment.DoctorId,
            PatientId = appointment.PatientId, PatientBookId = appointment.PatientBookId,
            ExaminationDate = appointment.AppointmentDate, PaperBookUpdatedAt = DateTime.UtcNow,
            Symptoms = "Keep current demo symptoms", Conclusion = "Keep current demo conclusion" };
        current.Prescription = new Prescription { PrescriptionDate = appointment.AppointmentDate,
            Status = "Issued", Notes = "Keep current prescription notes",
            Details = [new PrescriptionDetail { MedicineId = 1006, Quantity = 2, Dosage = "Keep dosage", Instructions = "Keep instructions" }] };
        db.Add(current);
        await db.SaveChangesAsync();
        await db.Database.ExecuteSqlRawAsync(script);
        await db.Database.ExecuteSqlRawAsync(script);
        var newInvoice = await db.Invoices.AsNoTracking().Include(x => x.InvoiceDetails)
            .SingleAsync(x => x.AppointmentId == 1025);
        var keptPrescription = await db.Prescriptions.AsNoTracking().Include(x => x.Details)
            .SingleAsync(x => x.MedicalRecordId == current.MedicalRecordId);
        check(await db.Invoices.CountAsync() == invoiceCount + 4 && newInvoice.Status == "Unpaid"
            && newInvoice.TotalAmount == 140000m && newInvoice.InvoiceDetails.Count == 2
            && keptPrescription.Status == "Issued" && keptPrescription.Notes == "Keep current prescription notes"
            && keptPrescription.Details.Single().Dosage == "Keep dosage" && keptPrescription.Details.Single().Quantity == 2,
            "D6 billing seed adds an unpaid invoice to the completed current demo visit without editing or dispensing its prescription");
        client.DefaultRequestHeaders.Authorization = null;
    }

    public static async Task<(int AppointmentId, int HistoricalRecordId)> RunAsync(
        HttpClient client, ApplicationDbContext db, string password, Action<bool, string> check)
    {
        VerifyExaminationPatientIdentity(check);
        var now = DateTime.UtcNow;
        var today = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(now, "Asia/Ho_Chi_Minh").Date;
        var profile = new Patient { FullName = "History Test Patient", Phone = "0900123456",
            BirthDate = new DateTime(1981, 5, 14), CreatedAt = now };
        var unrelatedPatient = new Patient { FullName = profile.FullName, Phone = profile.Phone, CreatedAt = now };
        var otherDoctorUser = new User { Username = "d6doctor", FullName = "History Other Doctor",
            RoleId = 2, PasswordHash = (await db.Users.SingleAsync(x => x.Username == "testdoctor")).PasswordHash,
            CreatedAt = now };
        db.AddRange(profile, unrelatedPatient, otherDoctorUser);
        await db.SaveChangesAsync();
        var otherDoctor = await db.Doctors.SingleAsync(x => x.DoctorId == 2);
        otherDoctor.UserId = otherDoctorUser.UserId;
        otherDoctor.FullName = otherDoctorUser.FullName;
        await db.SaveChangesAsync();

        var oldBook = new PatientBook { PatientId = profile.PatientId, BookNumber = "D6-OLD",
            Status = "Replaced", IssuedAt = now.AddDays(-30), CreatedAt = now, UpdatedAt = now };
        var currentBook = new PatientBook { PatientId = profile.PatientId, BookNumber = "D6-CURRENT",
            Status = "Issued", IssuedAt = now, CreatedAt = now, UpdatedAt = now, PreviousBook = oldBook };
        var unrelatedBook = new PatientBook { PatientId = unrelatedPatient.PatientId, BookNumber = "D6-OTHER",
            Status = "Issued", IssuedAt = now, CreatedAt = now, UpdatedAt = now };
        db.AddRange(oldBook, currentBook, unrelatedBook);
        await db.SaveChangesAsync();

        Appointment Visit(int doctorId, int? profileId, PatientBook? book, DateTime date, string status) => new()
        {
            DoctorId = doctorId, PatientProfileId = profileId, PatientBookId = book?.PatientBookId,
            PatientName = profile.FullName, PatientPhone = profile.Phone, AppointmentDate = date,
            StartTime = TimeSpan.FromHours(9), EndTime = TimeSpan.FromHours(9.5), Status = status,
            Reason = "D6 history verification", CreatedAt = now,
            BookVerifiedAt = book == null ? null : now, CheckedInAt = book == null ? null : now
        };
        var source = Visit(1, profile.PatientId, currentBook, today, "InProgress");
        var older = Visit(2, null, oldBook, today.AddDays(-14), "Completed");
        var recent = Visit(1, profile.PatientId, currentBook, today.AddDays(-2), "Completed");
        var draft = Visit(2, profile.PatientId, currentBook, today.AddDays(-1), "InProgress");
        var unrelated = Visit(2, unrelatedPatient.PatientId, unrelatedBook, today.AddDays(-3), "Completed");
        var uncheckedVisit = Visit(1, profile.PatientId, null, today.AddDays(1), "Confirmed");
        db.AddRange(source, older, recent, draft, unrelated, uncheckedVisit);
        await db.SaveChangesAsync();

        var disease = new Disease { DiseaseCode = "D6-QA", DiseaseName = "History test diagnosis", CreatedAt = now };
        db.Diseases.Add(disease);
        await db.SaveChangesAsync();
        MedicalRecord Record(Appointment visit) => new()
        {
            AppointmentId = visit.AppointmentId, DoctorId = visit.DoctorId,
            PatientBookId = visit.PatientBookId, ExaminationDate = visit.AppointmentDate,
            Symptoms = "History symptoms", Conclusion = "History conclusion", CreatedAt = now,
            UpdatedAt = now, PaperBookUpdatedAt = now,
            Diagnoses = [new RecordDiagnosis { DiseaseId = disease.DiseaseId, IsPrimary = true }]
        };
        var oldRecord = Record(older);
        var latestRecord = Record(recent);
        var draftRecord = Record(draft);
        var unrelatedRecord = Record(unrelated);
        db.AddRange(oldRecord, latestRecord, draftRecord, unrelatedRecord);
        await db.SaveChangesAsync();
        db.Prescriptions.Add(new Prescription
        {
            MedicalRecordId = oldRecord.MedicalRecordId, PrescriptionDate = older.AppointmentDate,
            Status = "Issued", Notes = "Historical instructions", CreatedAt = now, UpdatedAt = now,
            Details = [new PrescriptionDetail { MedicineId = await db.Medicines.Select(x => x.MedicineId).FirstAsync(),
                Quantity = 5, Dosage = "One tablet daily", Instructions = "After meals" }]
        });
        await db.SaveChangesAsync();

        async Task<JsonNode?> Get(string path, int expectedStatus = 200)
        {
            using var response = await client.GetAsync(path);
            check((int)response.StatusCode == expectedStatus, $"D6 GET {path}: {(int)response.StatusCode}");
            var body = await response.Content.ReadFromJsonAsync<JsonNode>();
            return body?["result"];
        }
        using var login = await client.PostAsJsonAsync("api/auth/login", new { username = "testdoctor", password });
        var session = (await login.Content.ReadFromJsonAsync<JsonNode>())!["result"]!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session["accessToken"]!.GetValue<string>());
        var path = $"api/medical-records/by-appointment/{source.AppointmentId}/history";

        var summary = (await Get(path + "/summary"))!;
        check(summary["patientId"]!.GetValue<int>() == profile.PatientId
            && summary["patientBookNumber"]!.GetValue<string>() == currentBook.BookNumber,
            "D6 uses the Patient profile and current visit's book for a patient without an account");
        check(summary["totalCompletedVisits"]!.GetValue<int>() == 2
            && summary["totalDoctors"]!.GetValue<int>() == 2,
            "D6 includes prior doctors and replaced books, excludes drafts and unrelated patients");
        var history = (await Get(path + "?pageSize=1"))!;
        check(history["totalItems"]!.GetValue<int>() == 2
            && history["items"]![0]!["medicalRecordId"]!.GetValue<int>() == latestRecord.MedicalRecordId,
            "D6 paginates completed visits newest first");
        var secondPage = (await Get(path + "?pageSize=1&pageNumber=2"))!;
        check(secondPage["items"]![0]!["medicalRecordId"]!.GetValue<int>() == oldRecord.MedicalRecordId,
            "D6 returns older visits on the next page");
        var byCode = (await Get(path + $"?search=HS-{oldRecord.MedicalRecordId:D5}"))!;
        check(byCode["totalItems"]!.GetValue<int>() == 1, "D6 searches formatted record codes");
        var byDiagnosis = (await Get(path + "?search=D6-QA"))!;
        check(byDiagnosis["totalItems"]!.GetValue<int>() == 2, "D6 searches diagnoses");
        var date = older.AppointmentDate.ToString("yyyy-MM-dd");
        var byDate = (await Get(path + $"?fromDate={date}&toDate={date}"))!;
        check(byDate["totalItems"]!.GetValue<int>() == 1, "D6 includes both date boundaries");
        await Get(path + $"?fromDate={today:yyyy-MM-dd}&toDate={date}", 400);

        var detail = (await Get(path + $"/{oldRecord.MedicalRecordId}"))!;
        check(detail["record"]!["patientBookNumber"]!.GetValue<string>() == oldBook.BookNumber
            && detail["prescription"]!["details"]![0]!["quantity"]!.GetValue<int>() == 5,
            "D6 reads the original book, prescription and dosage from another doctor's visit");
        await Get(path + $"/{unrelatedRecord.MedicalRecordId}", 404);
        await Get(path + $"/{draftRecord.MedicalRecordId}", 404);
        await Get($"api/medical-records/by-appointment/{older.AppointmentId}/history", 403);
        await Get($"api/medical-records/by-appointment/{uncheckedVisit.AppointmentId}/history", 400);
        await Get($"api/medical-records/{oldRecord.MedicalRecordId}", 403);
        using var editResponse = await client.PutAsJsonAsync($"api/medical-records/{oldRecord.MedicalRecordId}",
            new { symptoms = "Changed", conclusion = "Changed", markCompleted = false, expectedUpdatedAt = oldRecord.UpdatedAt,
                diagnoses = new[] { new { diseaseId = disease.DiseaseId, isPrimary = true } } });
        check((int)editResponse.StatusCode == 403, "D6 history access does not grant editing another doctor's record");
        await Get("api/medical-records/me/history", 403);
        client.DefaultRequestHeaders.Authorization = null;
        await Get(path, 401);
        await Get("api/medical-records/me/history", 401);

        var patientUsers = new[] { "d6patient", "d6otherpatient", "d6emptypatient", "d6noprofile" }
            .Select(name => new User { Username = name, FullName = name, RoleId = 4,
                PasswordHash = otherDoctorUser.PasswordHash, CreatedAt = now }).ToArray();
        db.Users.AddRange(patientUsers);
        await db.SaveChangesAsync();
        profile.UserId = patientUsers[0].UserId;
        unrelatedPatient.UserId = patientUsers[1].UserId;
        db.Patients.Add(new Patient { UserId = patientUsers[2].UserId, FullName = "No visits yet",
            Phone = "0900111111", CreatedAt = now });
        await db.SaveChangesAsync();

        async Task LoginPatient(string username)
        {
            using var response = await client.PostAsJsonAsync("api/auth/login", new { username, password });
            var auth = (await response.Content.ReadFromJsonAsync<JsonNode>())!["result"]!;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth["accessToken"]!.GetValue<string>());
        }
        await LoginPatient("d6patient");
        const string myHistory = "api/medical-records/me/history";
        var mySummary = (await Get(myHistory + "/summary"))!;
        check(mySummary["patientCode"]!.GetValue<string>() == $"BN-{profile.PatientId:D5}"
            && mySummary["totalCompletedVisits"]!.GetValue<int>() == 2
            && mySummary["totalPrescriptions"]!.GetValue<int>() == 1,
            "D6 patient summary retains pre-account visits and counts prescriptions separately");
        var myList = (await Get(myHistory + $"?patientId={unrelatedPatient.PatientId}&pageSize=1"))!;
        check(myList["totalItems"]!.GetValue<int>() == 2
            && myList["items"]![0]!["medicalRecordId"]!.GetValue<int>() == latestRecord.MedicalRecordId,
            "D6 patient identity comes from JWT, never a patient ID supplied in the URL");
        var myDetail = (await Get(myHistory + $"/{oldRecord.MedicalRecordId}"))!;
        check(myDetail["record"]!["patientBookNumber"]!.GetValue<string>() == oldBook.BookNumber
            && myDetail["prescription"]!["status"]!.GetValue<string>() == "Issued",
            "D6 patient reads replaced-book history without implying the prescription was dispensed");
        check(myDetail["medicineBilling"]!["totalMedicineAmount"] == null
            && myDetail["medicineBilling"]!["invoices"]!.AsArray().Count == 0,
            "D6 an unbilled prescription has no guessed price or zero-cost invoice");
        check((await Get(myHistory + $"/{latestRecord.MedicalRecordId}"))!["medicineBilling"] == null,
            "D6 a record without a prescription has no medicine billing section");
        await VerifyMedicineBillingAsync(db, oldRecord, profile.PatientId,
            () => Get(myHistory + $"/{oldRecord.MedicalRecordId}"), check);
        using (var doctorLogin = await client.PostAsJsonAsync("api/auth/login", new { username = "testdoctor", password }))
        {
            var doctorAuth = (await doctorLogin.Content.ReadFromJsonAsync<JsonNode>())!["result"]!;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", doctorAuth["accessToken"]!.GetValue<string>());
            check((await Get(path + $"/{oldRecord.MedicalRecordId}"))!["medicineBilling"] == null,
                "D6 doctor history does not expose patient invoice financial data");
        }
        await LoginPatient("d6patient");
        await Get(myHistory + $"/{unrelatedRecord.MedicalRecordId}", 404);
        await Get(myHistory + $"/{draftRecord.MedicalRecordId}", 404);
        await Get(path, 403);
        var patientSearch = (await Get(myHistory + "?search=History%20Other%20Doctor"))!;
        check(patientSearch["totalItems"]!.GetValue<int>() == 1, "D6 patient filters by doctor");
        await Get(myHistory + $"?fromDate={today:yyyy-MM-dd}&toDate={date}", 400);

        await LoginPatient("d6otherpatient");
        await Get(myHistory + $"/{oldRecord.MedicalRecordId}", 404);
        var otherHistory = (await Get(myHistory))!;
        check(otherHistory["totalItems"]!.GetValue<int>() == 1
            && otherHistory["items"]![0]!["medicalRecordId"]!.GetValue<int>() == unrelatedRecord.MedicalRecordId,
            "D6 identical names and phone numbers do not merge patient account histories");
        await LoginPatient("d6emptypatient");
        var emptySummary = (await Get(myHistory + "/summary"))!;
        var emptyList = (await Get(myHistory))!;
        check(emptySummary["totalCompletedVisits"]!.GetValue<int>() == 0
            && emptySummary["latestExaminationDate"] == null && emptyList["totalItems"]!.GetValue<int>() == 0,
            "D6 new patients get an empty history rather than another patient's records");
        await LoginPatient("d6noprofile");
        await Get(myHistory + "/summary", 404);
        await VerifyPaperBookConfirmationAsync(client, db, password, disease.DiseaseId, check);
        await VerifyConcurrentWritesAndBillingAsync(client, db, password, disease.DiseaseId, check);
        client.DefaultRequestHeaders.Authorization = null;

        return (source.AppointmentId, oldRecord.MedicalRecordId);
    }

    private static async Task VerifyPaperBookConfirmationAsync(
        HttpClient client, ApplicationDbContext db, string password, int diseaseId, Action<bool, string> check)
    {
        using var login = await client.PostAsJsonAsync("api/auth/login", new { username = "testdoctor", password });
        var auth = (await login.Content.ReadFromJsonAsync<JsonNode>())!["result"]!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth["accessToken"]!.GetValue<string>());
        var stock = await db.Inventory.AsNoTracking().OrderBy(x => x.InventoryId)
            .Select(x => new { x.InventoryId, x.QuantityInStock }).ToListAsync();
        var invoiceCount = await db.Invoices.CountAsync();
        var patient = new Patient { FullName = "Paper book state test", Phone = "0900999000" };
        var book = new PatientBook { Patient = patient, BookNumber = "D6-STATE", Status = "Issued" };
        var appointment = new Appointment { DoctorId = 1, PatientProfile = patient, PatientBook = book,
            PatientName = patient.FullName, PatientPhone = patient.Phone,
            AppointmentDate = DateTime.Today, StartTime = TimeSpan.FromHours(11), EndTime = TimeSpan.FromHours(11.5),
            Status = "InProgress", CheckedInAt = DateTime.UtcNow, BookVerifiedAt = DateTime.UtcNow };
        db.Add(appointment);
        await db.SaveChangesAsync();

        async Task<JsonNode?> Send(HttpMethod method, string path, object? payload = null, int status = 200)
        {
            using var request = new HttpRequestMessage(method, path);
            if (payload != null) request.Content = JsonContent.Create(payload);
            using var response = await client.SendAsync(request);
            check((int)response.StatusCode == status, $"D6 paper book {method} {path}: {(int)response.StatusCode}");
            return (await response.Content.ReadFromJsonAsync<JsonNode>())?["result"];
        }
        var symptoms = "Initial symptoms";
        var conclusion = "Initial conclusion";
        var note = "Initial diagnosis note";
        JsonNode? record = null;
        object Clinical(bool confirmed, bool completed = false) => new {
            appointmentId = appointment.AppointmentId, patientBookId = book.PatientBookId,
            expectedUpdatedAt = record?["updatedAt"]?.GetValue<string>(),
            symptoms, conclusion, paperBookConfirmed = confirmed, markCompleted = completed,
            diagnoses = new[] { new { diseaseId, isPrimary = true, note } }
        };
        record = (await Send(HttpMethod.Post, "api/medical-records", Clinical(true), 201))!;
        var recordPath = $"api/medical-records/{record["medicalRecordId"]}";
        var savedTimestamp = record["paperBookUpdatedAt"]!.GetValue<string>();
        check(record["status"]!.GetValue<string>() == "InProgress", "D6 confirming and saving does not complete the visit");
        symptoms = " Initial symptoms ";
        note = " Initial diagnosis note ";
        record = (await Send(HttpMethod.Put, recordPath, Clinical(false)))!;
        check(record["paperBookUpdatedAt"]!.GetValue<string>() == savedTimestamp,
            "D6 unchanged normalized clinical content preserves saved paper-book timestamp");
        symptoms = "Changed symptoms";
        await Send(HttpMethod.Put, recordPath, Clinical(false, true), 400);
        record = (await Send(HttpMethod.Get, recordPath))!;
        check(record["symptoms"]!.GetValue<string>() == "Initial symptoms"
            && record["paperBookUpdatedAt"]!.GetValue<string>() == savedTimestamp,
            "D6 rejected completion does not overwrite content or confirmation");
        record = (await Send(HttpMethod.Put, recordPath, Clinical(false)))!;
        check(record["paperBookUpdatedAt"] == null, "D6 saving changed symptoms invalidates saved confirmation");
        record = (await Send(HttpMethod.Put, recordPath, Clinical(true)))!;
        conclusion = "Changed conclusion";
        record = (await Send(HttpMethod.Put, recordPath, Clinical(false)))!;
        check(record["paperBookUpdatedAt"] == null, "D6 changing conclusion invalidates confirmation");
        record = (await Send(HttpMethod.Put, recordPath, Clinical(true)))!;
        note = "Changed diagnosis note";
        record = (await Send(HttpMethod.Put, recordPath, Clinical(false)))!;
        check(record["paperBookUpdatedAt"] == null, "D6 changing diagnosis notes invalidates confirmation");
        record = (await Send(HttpMethod.Put, recordPath, Clinical(true, true)))!;

        var medicineId = await db.Medicines.Select(x => x.MedicineId).FirstAsync();
        var quantity = 2;
        var dosage = "One daily";
        var instructions = "After meals";
        var notes = "Prescription note";
        object Prescription() => new { medicalRecordId = record["medicalRecordId"]!.GetValue<int>(), notes,
            details = new[] { new { medicineId, quantity, dosage, instructions } } };
        var prescription = (await Send(HttpMethod.Post, "api/prescriptions", Prescription(), 201))!;
        var prescriptionPath = $"api/prescriptions/{prescription["prescriptionId"]}";
        record = (await Send(HttpMethod.Get, recordPath))!;
        check(record["paperBookUpdatedAt"] == null && record["status"]!.GetValue<string>() == "InProgress",
            "D6 creating a prescription reopens a completed visit and invalidates confirmation");
        record = (await Send(HttpMethod.Put, recordPath, Clinical(true, true)))!;
        savedTimestamp = record["paperBookUpdatedAt"]!.GetValue<string>();
        var savedVersion = record["updatedAt"]!.GetValue<string>();
        var detailId = prescription["details"]![0]!["prescriptionDetailId"]!.GetValue<int>();
        dosage = " One daily ";
        prescription = (await Send(HttpMethod.Put, prescriptionPath, Prescription()))!;
        record = (await Send(HttpMethod.Get, recordPath))!;
        check(record["paperBookUpdatedAt"]!.GetValue<string>() == savedTimestamp
            && record["updatedAt"]!.GetValue<string>() == savedVersion && record["status"]!.GetValue<string>() == "Completed"
            && prescription["details"]![0]!["prescriptionDetailId"]!.GetValue<int>() == detailId,
            "D6 an unchanged prescription save preserves confirmation, record version, detail IDs and completion");
        foreach (var field in new[] { "quantity", "dosage", "instructions", "notes" })
        {
            if (field == "quantity") quantity = 3;
            if (field == "dosage") dosage = "Two daily";
            if (field == "instructions") instructions = "Before meals";
            if (field == "notes") notes = "Updated prescription note";
            await Send(HttpMethod.Put, prescriptionPath, Prescription());
            record = (await Send(HttpMethod.Get, recordPath))!;
            check(record["paperBookUpdatedAt"] == null && record["status"]!.GetValue<string>() == "InProgress",
                $"D6 changing prescription {field} requires renewed paper-book confirmation and completion");
            await Send(HttpMethod.Put, recordPath, Clinical(false, true), 400);
            record = (await Send(HttpMethod.Put, recordPath, Clinical(true, true)))!;
        }
        quantity = 0;
        await Send(HttpMethod.Put, prescriptionPath, Prescription(), 400);
        record = (await Send(HttpMethod.Get, recordPath))!;
        check(record["paperBookUpdatedAt"] != null && record["status"]!.GetValue<string>() == "Completed",
            "D6 an invalid prescription request does not invalidate saved confirmation");
        quantity = 3;
        await Send(HttpMethod.Patch, prescriptionPath + "/cancel");
        record = (await Send(HttpMethod.Get, recordPath))!;
        check(record["paperBookUpdatedAt"] == null && record["status"]!.GetValue<string>() == "InProgress",
            "D6 cancelling a prescription invalidates the paper-book declaration");
        record = (await Send(HttpMethod.Put, recordPath, Clinical(true, true)))!;
        await Send(HttpMethod.Post, "api/prescriptions", Prescription(), 201);
        record = (await Send(HttpMethod.Get, recordPath))!;
        check(record["paperBookUpdatedAt"] == null && record["status"]!.GetValue<string>() == "InProgress",
            "D6 reissuing a cancelled prescription invalidates the paper-book declaration");
        check(invoiceCount == await db.Invoices.CountAsync() && stock.SequenceEqual(
            await db.Inventory.AsNoTracking().OrderBy(x => x.InventoryId)
                .Select(x => new { x.InventoryId, x.QuantityInStock }).ToListAsync()),
            "D6 paper-book state changes never create invoices or deduct stock");
    }

    private static async Task VerifyConcurrentWritesAndBillingAsync(
        HttpClient client, ApplicationDbContext db, string password, int diseaseId, Action<bool, string> check)
    {
        var user = new User { Username = "d6billedpatient", FullName = "D6 billed patient", RoleId = 4,
            PasswordHash = (await db.Users.SingleAsync(x => x.Username == "testdoctor")).PasswordHash };
        var patient = new Patient { User = user, FullName = user.FullName, Phone = "0900999111" };
        var book = new PatientBook { Patient = patient, BookNumber = "D6-CONCURRENT", Status = "Issued" };
        var appointment = new Appointment { DoctorId = 1, PatientProfile = patient, PatientBook = book,
            PatientName = patient.FullName, PatientPhone = patient.Phone,
            AppointmentDate = DateTime.Today, StartTime = TimeSpan.FromHours(12), EndTime = TimeSpan.FromHours(12.5),
            Status = "InProgress", CheckedInAt = DateTime.UtcNow, BookVerifiedAt = DateTime.UtcNow };
        db.Add(appointment);
        await db.SaveChangesAsync();
        async Task<string> Login(string username)
        {
            using var response = await client.PostAsJsonAsync("api/auth/login", new { username, password });
            return (await response.Content.ReadFromJsonAsync<JsonNode>())!["result"]!["accessToken"]!.GetValue<string>();
        }
        var doctorToken = await Login("testdoctor");
        var patientToken = await Login(user.Username);
        async Task<JsonNode?> Send(HttpMethod method, string path, object? payload = null,
            int status = 200, string? token = null, int? errorCode = null)
        {
            using var request = new HttpRequestMessage(method, path);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token ?? doctorToken);
            if (payload != null) request.Content = JsonContent.Create(payload);
            using var response = await client.SendAsync(request);
            var body = await response.Content.ReadFromJsonAsync<JsonNode>();
            check((int)response.StatusCode == status, $"D6 write regression {method} {path}: {(int)response.StatusCode}");
            if (errorCode.HasValue) check(body!["code"]!.GetValue<int>() == errorCode, $"D6 write conflict uses code {errorCode}");
            return body?["result"];
        }
        object Clinical(string? version, bool complete = false, string symptoms = "Current symptoms") => new {
            appointmentId = appointment.AppointmentId, patientBookId = book.PatientBookId,
            symptoms, conclusion = "Current conclusion", paperBookConfirmed = true, markCompleted = complete,
            expectedUpdatedAt = version, diagnoses = new[] { new { diseaseId, isPrimary = true } }
        };
        var record = (await Send(HttpMethod.Post, "api/medical-records", Clinical(null), 201))!;
        var recordPath = $"api/medical-records/{record["medicalRecordId"]}";
        var oldVersion = record["updatedAt"]!.GetValue<string>();
        var medicineIds = await db.Medicines.OrderBy(x => x.MedicineId).Select(x => x.MedicineId).Take(3).ToArrayAsync();
        var rows = new List<ClinicManagement.DTOs.Requests.SavePrescriptionDetailRequest> {
            new() { MedicineId = medicineIds[0], Quantity = 2, Dosage = "One daily", Instructions = "After meals" },
            new() { MedicineId = medicineIds[1], Quantity = 3, Dosage = "One daily", Instructions = "After meals" }
        };
        var notes = "Original instructions";
        object Prescription() => new { medicalRecordId = record["medicalRecordId"]!.GetValue<int>(), notes, details = rows };
        var prescription = (await Send(HttpMethod.Post, "api/prescriptions", Prescription(), 201))!;
        var prescriptionPath = $"api/prescriptions/{prescription["prescriptionId"]}";
        await Send(HttpMethod.Put, recordPath, Clinical(null, true), 400);
        await Send(HttpMethod.Put, recordPath, Clinical(oldVersion, true), 409, errorCode: 7107);
        record = (await Send(HttpMethod.Get, recordPath))!;
        var staleCompletion = Clinical(record["updatedAt"]!.GetValue<string>(), true);
        notes = "Instructions changed by another tab";
        prescription = (await Send(HttpMethod.Put, prescriptionPath, Prescription()))!;
        await Send(HttpMethod.Put, recordPath, staleCompletion, 409, errorCode: 7107);
        record = (await Send(HttpMethod.Get, recordPath))!;
        check(record["paperBookUpdatedAt"] == null && record["status"]!.GetValue<string>() == "InProgress"
            && record["symptoms"]!.GetValue<string>() == "Current symptoms",
            "D6 a stale tab cannot confirm, overwrite or complete a changed prescription");

        var version = record["updatedAt"]!.GetValue<string>();
        var saves = await Task.WhenAll(client.PutAsJsonAsync(recordPath, Clinical(version, symptoms: "Tab A symptoms")),
            client.PutAsJsonAsync(recordPath, Clinical(version, symptoms: "Tab B symptoms")));
        try
        {
            check(saves.Select(x => (int)x.StatusCode).OrderBy(x => x).SequenceEqual(new[] { 200, 409 }),
                "D6 simultaneous saves with the same version commit exactly one writer");
        }
        finally { foreach (var response in saves) response.Dispose(); }
        record = (await Send(HttpMethod.Get, recordPath))!;
        await Send(HttpMethod.Put, recordPath, Clinical(version), 409, errorCode: 7107);
        record = (await Send(HttpMethod.Put, recordPath, Clinical(record["updatedAt"]!.GetValue<string>(), true)))!;
        check(record["status"]!.GetValue<string>() == "Completed" && record["paperBookUpdatedAt"] != null,
            "D6 reloading and reconfirming the current version permits explicit completion");

        var detailIds = prescription["details"]!.AsArray().Select(x => x!["prescriptionDetailId"]!.GetValue<int>()).ToArray();
        var invoice = new Invoice { AppointmentId = appointment.AppointmentId, PatientId = patient.PatientId,
            CashierId = await db.Users.Where(x => x.Username == "testadmin").Select(x => x.UserId).SingleAsync(),
            BillingStage = "Medicine", Status = "Paid", TotalAmount = 50000m, PatientAmount = 50000m,
            InvoiceDetails = detailIds.Select((id, index) => new InvoiceDetail { SourceType = "PrescriptionDetail", SourceId = id,
                ItemName = "Snapshot medicine", UnitPrice = 10000m, Quantity = index + 2, TotalPrice = (index + 2) * 10000m }).ToList() };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();
        var historyPath = $"api/medical-records/me/history/{record["medicalRecordId"]}";
        var before = (await Send(HttpMethod.Get, historyPath, token: patientToken))!["medicineBilling"]!;
        check(before["totalMedicineAmount"]!.GetValue<decimal>() == 50000m, "D6 billed history contains the saved medicine total");
        notes = "Only corrected doctor notes";
        prescription = (await Send(HttpMethod.Put, prescriptionPath, Prescription()))!;
        check(prescription["details"]!.AsArray().Select(x => x!["prescriptionDetailId"]!.GetValue<int>()).SequenceEqual(detailIds),
            "D6 changing notes preserves all invoice source IDs");
        record = (await Send(HttpMethod.Get, recordPath))!;
        record = (await Send(HttpMethod.Put, recordPath, Clinical(record["updatedAt"]!.GetValue<string>(), true)))!;
        var after = (await Send(HttpMethod.Get, historyPath, token: patientToken))!["medicineBilling"]!;
        check(after.ToJsonString() == before.ToJsonString(), "D6 paid invoice and medicine cost remain visible after a notes-only edit");

        rows[0].Dosage = "Corrected dosage";
        rows[1].Instructions = "Corrected instructions";
        rows.Reverse();
        prescription = (await Send(HttpMethod.Put, prescriptionPath, Prescription()))!;
        check(prescription["details"]!.AsArray().Select(x => x!["prescriptionDetailId"]!.GetValue<int>()).OrderBy(x => x)
            .SequenceEqual(detailIds.OrderBy(x => x)), "D6 dosage/instructions edits and reordering retain billed source IDs");
        record = (await Send(HttpMethod.Get, recordPath))!;
        record = (await Send(HttpMethod.Put, recordPath, Clinical(record["updatedAt"]!.GetValue<string>(), true)))!;
        var savedVersion = record["updatedAt"]!.GetValue<string>();
        var savedBookTime = record["paperBookUpdatedAt"]!.GetValue<string>();
        rows[0].Quantity++;
        await Send(HttpMethod.Put, prescriptionPath, Prescription(), 409, errorCode: 7407);
        rows[0].Quantity--;
        var kept = rows[0];
        rows.RemoveAt(0);
        await Send(HttpMethod.Put, prescriptionPath, Prescription(), 409, errorCode: 7407);
        rows.Insert(0, kept);
        rows.Add(new() { MedicineId = medicineIds[2], Quantity = 1, Dosage = "One daily", Instructions = "After meals" });
        await Send(HttpMethod.Put, prescriptionPath, Prescription(), 409, errorCode: 7407);
        rows.RemoveAt(rows.Count - 1);
        await Send(HttpMethod.Patch, prescriptionPath + "/cancel", status: 409, errorCode: 7407);
        record = (await Send(HttpMethod.Get, recordPath))!;
        check(record["updatedAt"]!.GetValue<string>() == savedVersion && record["paperBookUpdatedAt"]!.GetValue<string>() == savedBookTime
            && record["status"]!.GetValue<string>() == "Completed", "D6 blocked billing edits roll back version, confirmation and visit status");

        await db.Invoices.Where(x => x.Id == invoice.Id).ExecuteUpdateAsync(setters => setters
            .SetProperty(x => x.Status, "Unpaid").SetProperty(x => x.BillingStage, "Final"));
        var prescriptionId = prescription["prescriptionId"]!.GetValue<int>();
        await db.InvoiceDetails.Where(x => x.InvoiceId == invoice.Id).ExecuteUpdateAsync(setters => setters
            .SetProperty(x => x.SourceType, "Prescription").SetProperty(x => x.SourceId, prescriptionId));
        rows[0].Quantity++;
        await Send(HttpMethod.Put, prescriptionPath, Prescription(), 409, errorCode: 7407);
        rows[0].Quantity--;
        await Send(HttpMethod.Patch, prescriptionPath + "/cancel", status: 409, errorCode: 7407);
        await db.Prescriptions.Where(x => x.PrescriptionId == prescriptionId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.Status, "Cancelled"));
        await Send(HttpMethod.Post, "api/prescriptions", Prescription(), 409, errorCode: 7407);
        record = (await Send(HttpMethod.Get, recordPath))!;
        check(record["updatedAt"]!.GetValue<string>() == savedVersion,
            "D6 legacy cancelled orders with an active invoice cannot be silently reissued");
        var savedInvoice = await db.Invoices.AsNoTracking().Include(x => x.InvoiceDetails).SingleAsync(x => x.Id == invoice.Id);
        check(savedInvoice.TotalAmount == 50000m && savedInvoice.InvoiceDetails.Sum(x => x.TotalPrice) == 50000m,
            "D6 prescription corrections never rewrite invoice money");
    }

    private static void VerifyExaminationPatientIdentity(Action<bool, string> check)
    {
        var doctor = new Doctor { DoctorId = 1, FullName = "Identity test doctor" };
        var book = new PatientBook { PatientBookId = 12, PatientId = 41, BookNumber = "D6-IDENTITY" };
        var visit = new Appointment { AppointmentId = 20, Doctor = doctor, PatientId = 73,
            PatientProfileId = 41, PatientBookId = book.PatientBookId, PatientBook = book };
        var queue = visit.ToQueueResponse();
        check(queue.PatientId == 73 && queue.PatientProfileId == 41 && queue.PatientBookNumber == book.BookNumber,
            "D6 examination queue separates account ID from canonical patient ID for paper-book matching");
        visit.PatientProfileId = null;
        visit.PatientId = null;
        check(visit.ToQueueResponse().PatientProfileId == 41,
            "D6 examination queue resolves older walk-in patient identity from the verified book");
        var record = new MedicalRecord { Appointment = visit, Doctor = doctor, PatientBook = book, PatientId = 73 };
        check(record.ToResponse().PatientId == 73 && record.ToResponse().PatientProfileId == 41,
            "D6 medical record preserves its book's canonical patient ID independently of account ID");
        record.PatientBook = null;
        visit.PatientBook = null;
        check(record.ToResponse().PatientProfileId == null,
            "D6 an unknown patient profile is never replaced with an account ID");
        record.UpdatedAt = new DateTime(2026, 10, 11, 2, 30, 0, DateTimeKind.Unspecified);
        check(record.ToResponse().UpdatedAt.Kind == DateTimeKind.Utc
            && record.ToResponse().UpdatedAt.Ticks == record.UpdatedAt.Ticks,
            "D6 saved and reloaded record versions use the same UTC timestamp representation");
    }

    private static async Task VerifyMedicineBillingAsync(
        ApplicationDbContext db, MedicalRecord record, int patientId,
        Func<Task<JsonNode?>> readDetail, Action<bool, string> check)
    {
        var prescription = await db.Prescriptions.Include(x => x.Details).ThenInclude(x => x.Medicine)
            .SingleAsync(x => x.MedicalRecordId == record.MedicalRecordId);
        var medicine = prescription.Details.Single();
        var now = DateTime.UtcNow;
        Invoice Bill(int? appointmentId = null, int? ownerId = null, string status = "Paid",
            string sourceType = "PrescriptionDetail", int? sourceId = null) => new()
        {
            AppointmentId = appointmentId ?? record.AppointmentId, PatientId = ownerId ?? patientId,
            CashierId = 1, BillingStage = "Final", Status = status, CreatedAt = now,
            TotalAmount = 150000m, InsuranceAmount = 30000m, PatientAmount = 120000m,
            PaymentMethod = "Cash",
            InvoiceDetails = [
                new InvoiceDetail { SourceType = sourceType, SourceId = sourceId ?? medicine.PrescriptionDetailId,
                    ItemName = "Saved medicine price", Quantity = 5, UnitPrice = 10000m, TotalPrice = 50000m },
                new InvoiceDetail { SourceType = "Appointment", SourceId = record.AppointmentId,
                    ItemName = "Consultation fee", Quantity = 1, UnitPrice = 100000m, TotalPrice = 100000m }
            ]
        };
        var paid = Bill();
        db.Invoices.AddRange(paid, Bill(ownerId: patientId + 999999), Bill(appointmentId: record.AppointmentId + 999999),
            Bill(sourceId: medicine.PrescriptionDetailId + 999999), Bill(status: "Cancelled"));
        await db.SaveChangesAsync();
        var originalPrice = medicine.Medicine.UnitPrice;
        await db.Medicines.Where(x => x.MedicineId == medicine.MedicineId)
            .ExecuteUpdateAsync(update => update.SetProperty(x => x.UnitPrice, 987654m));
        try
        {
            var billing = (await readDetail())!["medicineBilling"]!;
            check(billing["totalMedicineAmount"]!.GetValue<decimal>() == 50000m
                && billing["invoices"]!.AsArray().Count == 1,
                "D6 costs use saved medicine invoice lines, exclude consultation, cancelled and unrelated invoices");
            var invoice = billing["invoices"]![0]!;
            check(invoice["invoiceId"]!.GetValue<int>() == paid.Id
                && invoice["totalAmount"]!.GetValue<decimal>() == 150000m
                && invoice["insuranceAmount"]!.GetValue<decimal>() == 30000m
                && invoice["patientAmount"]!.GetValue<decimal>() == 120000m
                && invoice["status"]!.GetValue<string>() == "Paid"
                && invoice["details"]!.AsArray().Count == 2
                && invoice["details"]!.AsArray().Count(x => x!["isPrescriptionMedicine"]!.GetValue<bool>()) == 1,
                "D6 invoice view retains full snapshot and whole-invoice insurance split without allocating payments to medicine");
            var savedItem = invoice["details"]!.AsArray().Single(x => x!["isPrescriptionMedicine"]!.GetValue<bool>())!;
            check(savedItem["unitPrice"]!.GetValue<decimal>() == 10000m
                && savedItem["totalPrice"]!.GetValue<decimal>() == 50000m,
                "D6 changing current medicine price never changes the historical invoice");

            paid.Status = "Cancelled";
            var legacy = Bill(status: "Unpaid", sourceType: "Prescription", sourceId: prescription.PrescriptionId);
            legacy.BillingStage = "Medicine";
            legacy.TotalAmount = 15000m;
            legacy.InsuranceAmount = 0m;
            legacy.PatientAmount = 0m;
            legacy.InvoiceDetails = [new InvoiceDetail { SourceType = "Prescription", SourceId = prescription.PrescriptionId,
                ItemName = "Whole prescription", Quantity = 1, UnitPrice = 15000m, TotalPrice = 15000m }];
            db.Invoices.Add(legacy);
            await db.SaveChangesAsync();
            billing = (await readDetail())!["medicineBilling"]!;
            invoice = billing["invoices"]![0]!;
            check(billing["totalMedicineAmount"]!.GetValue<decimal>() == 15000m
                && billing["invoices"]!.AsArray().Count == 1
                && invoice["status"]!.GetValue<string>() == "Unpaid"
                && invoice["insuranceAmount"] == null && invoice["patientAmount"] == null,
                "D6 legacy prescription-level billing supports Unpaid and does not present missing financial splits as zero paid");

            legacy.Status = "Cancelled";
            var zero = Bill(status: "Unpaid");
            zero.BillingStage = "Medicine";
            zero.TotalAmount = zero.InsuranceAmount = zero.PatientAmount = 0m;
            zero.InvoiceDetails = [new InvoiceDetail { SourceType = "PrescriptionDetail", SourceId = medicine.PrescriptionDetailId,
                ItemName = "Zero-cost medicine", Quantity = 5, UnitPrice = 0m, TotalPrice = 0m }];
            db.Invoices.Add(zero);
            await db.SaveChangesAsync();
            billing = (await readDetail())!["medicineBilling"]!;
            check(billing["totalMedicineAmount"]!.GetValue<decimal>() == 0m
                && billing["invoices"]!.AsArray().Count == 1,
                "D6 an actual zero-cost invoice differs from a prescription without an invoice");
            zero.Status = "Cancelled";
            paid.Status = "Paid";
            await db.SaveChangesAsync();
            var appointment = await db.Appointments.SingleAsync(x => x.AppointmentId == record.AppointmentId);
            var accountId = (await db.Patients.SingleAsync(x => x.PatientId == patientId)).UserId!.Value;
            appointment.PatientId = accountId;
            paid.PatientId = accountId;
            await db.SaveChangesAsync();
            billing = (await readDetail())!["medicineBilling"]!;
            check(billing["totalMedicineAmount"]!.GetValue<decimal>() == 50000m
                && billing["invoices"]!.AsArray().Count == 1,
                "D6 account-bound billing uses the visit account ID even when it differs from canonical PatientId");
            appointment.PatientId = null;
            paid.PatientId = patientId;
            await db.SaveChangesAsync();
        }
        finally
        {
            await db.Medicines.Where(x => x.MedicineId == medicine.MedicineId)
                .ExecuteUpdateAsync(update => update.SetProperty(x => x.UnitPrice, originalPrice));
        }
    }
}

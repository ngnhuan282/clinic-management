using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

internal static class C8C9Checks
{
    private static DateTime Now => TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Asia/Ho_Chi_Minh");
    internal sealed record UiFixture(string Today, string FutureDate, int DoctorId, string DoctorName,
        string DepartmentName, int UiAppointmentId, string UiPatientName, int UiPatientId);

    public static async Task<UiFixture> RunAsync(HttpClient client, ApplicationDbContext db, string password,
        Action<bool, string> check, bool runC8, bool runC9)
    {
        var suite = new Suite(client, db, check);
        await suite.InitializeAsync(password);
        if (runC8) await suite.RaceAndStateChecksAsync();
        if (runC9) await suite.EndToEndChecksAsync();
        await suite.VerifyInvoiceMigrationAsync();
        return await suite.CreateUiFixtureAsync();
    }

    private sealed class Suite(HttpClient client, ApplicationDbContext db, Action<bool, string> check)
    {
        private string patient = "", otherPatient = "", reception = "", doctor = "", wrongDoctor = "", cashier = "";
        private int patientUserId, cashierUserId, diseaseId;
        private DateTime today = Now.Date;
        private readonly DateTime future = Now.Date.AddDays(40);
        private int arrivalIndex;
        private bool verifiedInUse;

        public async Task InitializeAsync(string password)
        {
            var admin = await ApiAsync("POST", "auth/login", "", new { username = "testadmin", password });
            await ApiAsync("POST", "rbac/roles", admin["accessToken"]!.GetValue<string>(), new
            {
                name = RoleConstants.Cashier, description = "C8/C9 disposable cashier",
                permissionCodes = new[] { PermissionCodes.BillingView, PermissionCodes.BillingCreate, PermissionCodes.BillingRecordPayment }
            }, 201);
            foreach (var (name, role) in new[] { ("c8patient", RoleConstants.Patient), ("c8other", RoleConstants.Patient),
                         ("c8cashier", RoleConstants.Cashier), ("c8doctor2", RoleConstants.Doctor) })
            {
                var roleId = await db.Roles.Where(x => x.RoleName == role).Select(x => x.RoleId).SingleAsync();
                db.Users.Add(new User { Username = name, FullName = name, RoleId = roleId,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), CreatedAt = DateTime.UtcNow });
            }
            await db.SaveChangesAsync();
            (await db.Doctors.SingleAsync(x => x.DoctorId == 2)).UserId =
                await db.Users.Where(x => x.Username == "c8doctor2").Select(x => x.UserId).SingleAsync();
            await db.SaveChangesAsync();
            async Task<JsonNode> LoginAsync(string name) => await ApiAsync("POST", "auth/login", "", new { username = name, password });
            var login = await LoginAsync("c8patient");
            patient = login["accessToken"]!.GetValue<string>();
            patientUserId = login["userId"]!.GetValue<int>();
            otherPatient = (await LoginAsync("c8other"))["accessToken"]!.GetValue<string>();
            reception = (await LoginAsync("testreceptionist"))["accessToken"]!.GetValue<string>();
            doctor = (await LoginAsync("testdoctor"))["accessToken"]!.GetValue<string>();
            wrongDoctor = (await LoginAsync("c8doctor2"))["accessToken"]!.GetValue<string>();
            var cashierLogin = await LoginAsync("c8cashier");
            cashier = cashierLogin["accessToken"]!.GetValue<string>();
            cashierUserId = cashierLogin["userId"]!.GetValue<int>();
            foreach (var date in new[] { today, today.AddDays(1), today.AddDays(5), future })
            foreach (var id in new[] { 1, 2 })
            {
                var schedule = new DoctorSchedule { DoctorId = id, RoomId = id, WorkDate = DateOnly.FromDateTime(date),
                    StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(23.5), Status = "Approved",
                    MaxPatients = 31, CreatedAt = DateTime.UtcNow };
                for (var hour = 8.0; hour < 23.5; hour += .5)
                    schedule.TimeSlots.Add(new TimeSlot { StartTime = TimeSpan.FromHours(hour),
                        EndTime = TimeSpan.FromHours(hour + .5), IsAvailable = true, MaxCapacity = 1 });
                db.DoctorSchedules.Add(schedule);
            }
            var disease = new Disease { DiseaseCode = "C8-DEMO", DiseaseName = "C8 test diagnosis", CreatedAt = DateTime.UtcNow };
            db.Diseases.Add(disease);
            await db.SaveChangesAsync();
            diseaseId = disease.DiseaseId;
            var cashierRoleId = await db.Users.Where(x => x.UserId == cashierUserId).Select(x => x.RoleId).SingleAsync();
            check(await db.RolePermissions.AnyAsync(x => x.RoleId == cashierRoleId
                    && x.PermissionCode == PermissionCodes.BillingRecordPayment), "C8/C9 uses a real Cashier role created through the RBAC API");
        }

        public async Task RaceAndStateChecksAsync()
        {
            for (var round = 0; round < 3; round++)
            {
                var time = TimeSpan.FromHours(8 + round * .5).ToString();
                var requests = Enumerable.Range(0, 8).Select(i => RequestAsync("POST", "appointments",
                    i % 2 == 0 ? patient : otherPatient, Booking(future, time, $"C8 race {round}-{i}", $"090800{round}{i:000}")));
                var responses = await Task.WhenAll(requests);
                CheckRace(responses, "C8 eight concurrent web bookings, round " + (round + 1));
                check(await db.Appointments.AsNoTracking().CountAsync(x => x.DoctorId == 1 && x.AppointmentDate == future
                    && x.StartTime == TimeSpan.Parse(time) && x.Status != "Cancelled") == 1,
                    "C8 SQL persists exactly one active appointment for the contested slot");
                check(!await SlotAvailableAsync(future, time), "C8 contested slot becomes unavailable");
                var winner = responses.Single(x => x.Status == 200).Data!["result"]!["appointmentId"]!.GetValue<int>();
                await ApiAsync("PATCH", $"appointments/{winner}/cancel", reception);
                check(await SlotAvailableAsync(future, time), "C8 cancellation releases the contested slot");
                await ApiAsync("POST", "appointments", patient, Booking(future, time, "C8 after cancellation", "0908000999"));
            }

            var mixedProfile = await NewProfileAsync("C8 mixed walk-in", "0908001001");
            var mixed = await Task.WhenAll(Enumerable.Range(0, 8).Select(i => i % 2 == 0
                ? RequestAsync("POST", "appointments", patient, Booking(future, "10:00:00", "C8 mixed web", "0908001002"))
                : RequestAsync("POST", "appointments/direct", reception, Direct(future, "10:00:00", mixedProfile))));
            CheckRace(mixed, "C8 web and walk-in contend for the same slot");

            var first = await ApiAsync("POST", "appointments", patient, Booking(future, "11:00:00", "C8 move A", "0908002001"));
            var second = await ApiAsync("POST", "appointments", otherPatient, Booking(future, "11:30:00", "C8 move B", "0908002002"));
            var moves = await Task.WhenAll(new[] { first, second }.Select(row => RequestAsync("PATCH",
                $"appointments/{Id(row)}/reschedule", reception, new { doctorId = 1, appointmentDate = future, startTime = "12:00:00" })));
            CheckRace(moves, "C8 concurrent reschedules cannot take the same destination");
            check(await SlotAvailableAsync(future, "11:00:00") != await SlotAvailableAsync(future, "11:30:00"),
                "C8 only the winning reschedule releases its old slot");

            var profile = await NewProfileAsync("C8 status patient", "0908003001");
            var pending = await ApiAsync("POST", "appointments", otherPatient, Booking(future, "13:00:00", profile.FullName, profile.Phone));
            var id = Id(pending);
            await ApiAsync("PATCH", $"appointments/{id}/patient-profile", reception, new { patientProfileId = profile.PatientId });
            var book = await ExistingBookAsync(profile, "C8-STATUS");
            await ApiAsync("PATCH", $"appointments/{id}/confirm", patient, status: 403);
            await ApiAsync("PATCH", $"appointments/{id}/check-in", reception, CheckIn(profile, book, true), 400, 5003);
            await ApiAsync("PATCH", $"appointments/{id}/start-examination", doctor, status: 400, code: 4005);
            await ApiAsync("POST", "medical-records", doctor, Record(id, book), 400, 4005);
            await ApiAsync("PATCH", $"appointments/{id}/confirm", reception);
            await ApiAsync("PATCH", $"appointments/{id}/confirm", reception, status: 400, code: 5003);
            await ApiAsync("PATCH", $"appointments/{id}/check-in", reception, CheckIn(profile, book, true), 400, 5003);
            await ApiAsync("PATCH", $"appointments/{id}/cancel", reception);
            await ApiAsync("PATCH", $"appointments/{id}/confirm", reception, status: 400, code: 5003);
            await ApiAsync("PATCH", $"appointments/{id}/reschedule", reception,
                new { doctorId = 1, appointmentDate = future, startTime = "13:30:00" }, 400, 5003);

            var arrival = await SeedArrivalAsync(profile, "C8 check-in gates", 5);
            var foreignProfile = await NewProfileAsync("C8 different patient", "0908003002");
            var foreignBook = await ExistingBookAsync(foreignProfile, "C8-FOREIGN");
            await ApiAsync("PATCH", $"appointments/{arrival}/check-in", reception, CheckIn(foreignProfile, foreignBook, true), 400, 4003);
            await ApiAsync("PATCH", $"appointments/{arrival}/check-in", reception, CheckIn(profile, foreignBook, true), 400, 4005);
            await ApiAsync("PATCH", $"appointments/{arrival}/check-in", reception, CheckIn(profile, book, false), 400, 4005);
            await ApiAsync("PATCH", $"appointments/{arrival}/check-in", patient, CheckIn(profile, book, true), 403);
            await ApiAsync("PATCH", $"appointments/{arrival}/start-examination", wrongDoctor, status: 403);
            var checks = await Task.WhenAll(Enumerable.Range(0, 2).Select(_ =>
                RequestAsync("PATCH", $"appointments/{arrival}/check-in", reception, CheckIn(profile, book, true))));
            check(checks.Count(x => x.Status == 200) == 1 && checks.Count(x => x.Status == 400) == 1,
                "C8 simultaneous reception check-ins yield one success and one business rejection, no 500");
            await ApiAsync("PATCH", $"appointments/{arrival}/cancel", reception, status: 400, code: 5003);
            await ApiAsync("PATCH", $"appointments/{arrival}/reschedule", reception,
                new { doctorId = 1, appointmentDate = future, startTime = "13:30:00" }, 400, 5003);
            await ApiAsync("PATCH", $"appointments/{arrival}/start-examination", doctor);
            var recordsBefore = await db.MedicalRecords.CountAsync(x => x.AppointmentId == arrival);
            var invalidProfile = await NewProfileAsync("C8 unpaid legacy", "0908003003");
            var unpaid = new BookInvoice { PatientId = invalidProfile.PatientId, Amount = 20000, Status = "Unpaid", CreatedAt = DateTime.UtcNow };
            db.BookInvoices.Add(unpaid);
            await db.SaveChangesAsync();
            var forged = new PatientBook { PatientId = invalidProfile.PatientId, BookInvoiceId = unpaid.BookInvoiceId,
                BookNumber = "C8-UNPAID", Status = "Issued", IssuedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            db.PatientBooks.Add(forged);
            await db.SaveChangesAsync();
            var invalidArrival = await SeedArrivalAsync(invalidProfile, "C8 unpaid arrival", 5.5);
            await ApiAsync("PATCH", $"appointments/{invalidArrival}/check-in", reception,
                CheckIn(invalidProfile, forged.PatientBookId, true), 400, 4005);
            check(recordsBefore == 0 && !await db.MedicalRecords.AnyAsync(x => x.AppointmentId == invalidArrival),
                "C8 rejected check-in never creates a medical record");
            await ApiAsync("POST", "appointments/direct", reception, Direct(future, "14:00:00", profile, false), 409, 4002);
            await ApiAsync("POST", "appointments/direct", reception, new { doctorId = 1, appointmentDate = future,
                startTime = "14:00:00", patientProfileId = profile.PatientId, patientName = "Wrong identity",
                patientPhone = profile.Phone, reason = "C8 forged match" }, 400, 4003);

            for (var round = 0; round < 4; round++)
            {
                var racing = await ApiAsync("POST", "appointments", patient,
                    Booking(future, TimeSpan.FromHours(15 + round * .5).ToString(), "C8 concurrent state", "0908004001"));
                var states = await Task.WhenAll(RequestAsync("PATCH", $"appointments/{Id(racing)}/confirm", reception),
                    RequestAsync("PATCH", $"appointments/{Id(racing)}/cancel", reception));
                check(states.All(x => x.Status is 200 or 400)
                    && await db.Appointments.AsNoTracking().AnyAsync(x => x.AppointmentId == Id(racing) && x.Status == "Cancelled"),
                    "C8 concurrent confirmation never revives a cancelled appointment, round " + (round + 1));
            }

            var paidProfile = await NewProfileAsync("C8 duplicate payment", "0908004002");
            var bill = await ApiAsync("POST", $"patients/{paidProfile.PatientId}/book-invoices", reception, new { amount = 10000 });
            var billId = bill["bookInvoiceId"]!.GetValue<int>();
            var payments = await Task.WhenAll(Enumerable.Range(0, 2).Select(_ => RequestAsync("PATCH", $"book-invoices/{billId}/pay", cashier)));
            check(payments.Count(x => x.Status == 200) == 1 && payments.Count(x => x.Status == 409) == 1,
                "C8 concurrent payment creates one Paid transition and one Pending book");
            var issues = await Task.WhenAll(Enumerable.Range(0, 2).Select(i => RequestAsync("POST", $"book-invoices/{billId}/issue-book",
                reception, new { bookNumber = "C8-RACE-ISSUE-" + i })));
            check(issues.Count(x => x.Status == 200) == 1 && issues.Count(x => x.Status == 409) == 1
                && await db.PatientBooks.CountAsync(x => x.BookInvoiceId == billId) == 1,
                "C8 concurrent issue requests give one numbered book and no deadlock/duplicate");
            await CheckInAndReissueChecksAsync();
            await ConcurrentCashierPaymentsAsync();
        }

        private async Task CheckInAndReissueChecksAsync()
        {
            for (var round = 0; round < 6; round++)
            {
                var profile = await NewProfileAsync("C8 check-in versus reissue " + round, $"09080050{round:00}");
                var oldBookId = await ExistingBookAsync(profile, "C8-REISSUE-OLD-" + round);
                var appointmentId = await SeedArrivalAsync(profile, "C8 check-in versus reissue", 1 + round * .5);
                var bill = await ApiAsync("POST", $"patients/{profile.PatientId}/book-invoices", reception, new { amount = 10000 });
                var invoiceId = bill["bookInvoiceId"]!.GetValue<int>();
                await ApiAsync("PATCH", $"book-invoices/{invoiceId}/pay", cashier);
                Task<Reply> CheckInAsync() => RequestAsync("PATCH", $"appointments/{appointmentId}/check-in", reception,
                    CheckIn(profile, oldBookId, true));
                Task<Reply> ReissueAsync() => RequestAsync("POST", $"book-invoices/{invoiceId}/issue-book", reception,
                    new { bookNumber = "C8-REISSUE-NEW-" + round });

                Reply checkIn, reissue;
                // Cover both serial orders as well as four genuinely concurrent attempts.
                if (round == 0) { checkIn = await CheckInAsync(); reissue = await ReissueAsync(); }
                else if (round == 1) { reissue = await ReissueAsync(); checkIn = await CheckInAsync(); }
                else
                {
                    var replies = round % 2 == 0
                        ? await Task.WhenAll(CheckInAsync(), ReissueAsync())
                        : await Task.WhenAll(ReissueAsync(), CheckInAsync());
                    checkIn = replies[round % 2 == 0 ? 0 : 1];
                    reissue = replies[round % 2 == 0 ? 1 : 0];
                }

                var checkInWon = checkIn.Status == 200 && reissue.Status == 409
                    && reissue.Data?["code"]?.GetValue<int>() == 4010;
                var reissueWon = reissue.Status == 200 && checkIn.Status == 400
                    && checkIn.Data?["code"]?.GetValue<int>() == 4005;
                check(checkInWon || reissueWon,
                    $"C8 check-in/reissue round {round + 1} is serialized without 500: check-in={checkIn.Status}, reissue={reissue.Status}");

                var appointment = await db.Appointments.AsNoTracking().SingleAsync(x => x.AppointmentId == appointmentId);
                var oldBook = await db.PatientBooks.AsNoTracking().SingleAsync(x => x.PatientBookId == oldBookId);
                var replacement = await db.PatientBooks.AsNoTracking().SingleAsync(x => x.BookInvoiceId == invoiceId);
                check(checkInWon
                    ? appointment.CheckedInAt != null && appointment.BookVerifiedAt != null && appointment.PatientBookId == oldBookId
                        && oldBook.Status == "Issued" && replacement.Status == "Pending"
                    : appointment.CheckedInAt == null && appointment.BookVerifiedAt == null && appointment.PatientBookId == null
                        && oldBook.Status == "Replaced" && replacement.Status == "Issued" && replacement.PreviousBookId == oldBookId,
                    "C8 check-in/reissue keeps the verified book valid or rejects the retired book, round " + (round + 1));
                check(await db.PatientBooks.CountAsync(x => x.PatientId == profile.PatientId && x.Status == "Issued") == 1
                    && !await db.MedicalRecords.AnyAsync(x => x.AppointmentId == appointmentId),
                    "C8 check-in/reissue preserves one Issued book and creates no premature MedicalRecord, round " + (round + 1));
            }
        }

        private async Task ConcurrentCashierPaymentsAsync()
        {
            var profile = await NewProfileAsync("C8 cashier payment race", "0908006001");
            var bill = await ApiAsync("POST", $"patients/{profile.PatientId}/book-invoices", reception, new { amount = 10000 });
            var invoiceId = bill["bookInvoiceId"]!.GetValue<int>();
            var body = new { patientId = profile.PatientId, billingStage = "Book", paymentMethod = "Cash",
                items = new[] { new { sourceType = "Book", sourceId = invoiceId, itemName = "C8 concurrent cashier book fee", unitPrice = 10000, quantity = 1 } } };
            await using var signal = await C8C9LiveEvents.ConnectAsync(client.BaseAddress!, reception);
            var replies = await Task.WhenAll(Enumerable.Range(0, 2).Select(_ => RequestAsync("POST", "invoices", cashier, body)));
            check(await db.InvoiceDetails.CountAsync(x => x.SourceType == "Book" && x.SourceId == invoiceId) == 1
                && await db.Invoices.CountAsync(x => x.PatientId == profile.PatientId && x.BillingStage == "Book" && x.Status == "Paid") == 1,
                "C8 concurrent POST /invoices collects the Book fee exactly once");
            check(await db.BookInvoices.AsNoTracking().AnyAsync(x => x.BookInvoiceId == invoiceId && x.Status == "Paid" && x.PaidAt != null),
                "C8 cashier race commits the matching reception invoice as Paid");
            await signal.WaitAsync("BookInvoiceChanged", "bookInvoiceId", invoiceId, "status", "Paid");
            check(replies.Count(x => x.Status == 200) == 1 && replies.Count(x => x.Status == 409) == 1,
                "C8 concurrent POST /invoices returns one success and one business conflict, no 500: "
                + string.Join(",", replies.Select(x => x.Status)));
        }

        public async Task EndToEndChecksAsync()
        {
            // The clinic uses a physical book. Waiting is represented by Confirmed + CheckedInAt, not a new status.
            var web = await ApiAsync("POST", "appointments", patient, Booking(ArrivalDate(), ArrivalTime(), "C9 web first visit", "0909000001"));
            check(web["status"]!.GetValue<string>() == "Pending" && web["patientBookId"] == null,
                "C9 web accepts a new patient without a book or check-in");
            await ApiAsync("PATCH", $"appointments/{Id(web)}/confirm", reception);
            var match = await ApiAsync("PATCH", $"appointments/{Id(web)}/patient-profile", reception, new { patientProfileId = (int?)null });
            var webProfile = await db.Patients.AsNoTracking().SingleAsync(x => x.PatientId == match["patientProfileId"]!.GetValue<int>());
            check(webProfile.UserId == patientUserId, "C9 reception links the verified web profile to its patient account");
            await NormalizeArrivalDateAsync(Id(web));
            var webBook = await PayAndIssueAsync(webProfile, "C9-WEB", Id(web), viaCashier: true);
            await ExamineAsync(Id(web), webProfile, webBook);

            var direct = await ApiAsync("POST", "appointments/direct", reception, new { doctorId = 1,
                appointmentDate = ArrivalDate(), startTime = ArrivalTime(), patientName = "C9 new walk-in",
                patientPhone = "0909000002", reason = "C9 new walk-in", birthDate = "1990-01-01" });
            var directProfile = await db.Patients.AsNoTracking().SingleAsync(x => x.PatientId == direct["patientProfileId"]!.GetValue<int>());
            check(direct["status"]!.GetValue<string>() == "Confirmed" && direct["patientBookId"] == null && directProfile.UserId == null,
                "C9 new walk-in is Confirmed with a real profile and no web-account requirement");
            await NormalizeArrivalDateAsync(Id(direct));
            var directBook = await PayAndIssueAsync(directProfile, "C9-WALKIN", Id(direct), viaCashier: false);
            await ExamineAsync(Id(direct), directProfile, directBook);

            var feeCount = await db.BookInvoices.CountAsync(x => x.PatientId == webProfile.PatientId);
            var cashierCount = await db.Invoices.CountAsync(x => x.PatientId == webProfile.PatientId && x.BillingStage == "Book");
            var returnVisit = await ApiAsync("POST", "appointments/direct", reception, Direct(ArrivalDate(), ArrivalTime(), webProfile));
            await NormalizeArrivalDateAsync(Id(returnVisit));
            await ExamineAsync(Id(returnVisit), webProfile, webBook);
            check(await db.BookInvoices.CountAsync(x => x.PatientId == webProfile.PatientId) == feeCount
                && await db.Invoices.CountAsync(x => x.PatientId == webProfile.PatientId && x.BillingStage == "Book") == cashierCount,
                "C9 follow-up reuses the existing physical book with zero additional Book charge");

            foreach (var situation in new[] { "lost", "forgotten" })
            {
                var profile = await NewProfileAsync("C9 " + situation, situation == "lost" ? "0909000003" : "0909000004");
                var previous = await ExistingBookAsync(profile, "C9-OLD-" + situation);
                if (situation == "lost")
                {
                    // Fixture state only: the separate book-management module owns marking a lost book.
                    await db.PatientBooks.Where(x => x.PatientBookId == previous).ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, "Lost"));
                }
                var appointment = await ApiAsync("POST", "appointments/direct", reception, Direct(ArrivalDate(), ArrivalTime(), profile));
                await NormalizeArrivalDateAsync(Id(appointment));
                await ApiAsync("PATCH", $"appointments/{Id(appointment)}/check-in", reception, CheckIn(profile, previous, false), 400, 4005);
                var replacement = await PayAndIssueAsync(profile, "C9-NEW-" + situation, Id(appointment), viaCashier: true);
                check(await db.PatientBooks.AsNoTracking().AnyAsync(x => x.PatientBookId == replacement && x.PreviousBookId == previous)
                    && await db.PatientBooks.CountAsync(x => x.PatientId == profile.PatientId && x.Status == "Issued") == 1,
                    "C9 " + situation + " replacement preserves history and exactly one Issued book");
                await ApiAsync("PATCH", $"appointments/{Id(appointment)}/check-in", reception, CheckIn(profile, previous, true), 400, 4005);
                await ExamineAsync(Id(appointment), profile, replacement);
            }
        }

        private async Task<int> PayAndIssueAsync(Patient profile, string number, int appointmentId, bool viaCashier)
        {
            var invoice = await ApiAsync("POST", $"patients/{profile.PatientId}/book-invoices", reception, new { amount = 20000 });
            var invoiceId = invoice["bookInvoiceId"]!.GetValue<int>();
            await ApiAsync("POST", $"book-invoices/{invoiceId}/issue-book", reception, new { bookNumber = number }, 409, 4008);
            await ApiAsync("PATCH", $"book-invoices/{invoiceId}/pay", patient, status: 403);
            await using var signal = await C8C9LiveEvents.ConnectAsync(client.BaseAddress!, reception);
            if (viaCashier)
                await ApiAsync("POST", "invoices", cashier, new { patientId = profile.PatientId, appointmentId,
                    billingStage = "Book", paymentMethod = "Cash", items = new[] { new { sourceType = "Book",
                        sourceId = invoiceId, itemName = "Phí sổ khám", unitPrice = 20000, quantity = 1 } } });
            else
                await ApiAsync("PATCH", $"book-invoices/{invoiceId}/pay", cashier);
            await signal.WaitAsync("BookInvoiceChanged", "bookInvoiceId", invoiceId, "status", "Paid");
            check(await db.BookInvoices.AsNoTracking().AnyAsync(x => x.BookInvoiceId == invoiceId && x.Status == "Paid" && x.PaidAt != null),
                "C9 real Paid event reaches reception after the payment transaction commits");
            var pending = await db.PatientBooks.AsNoTracking().SingleOrDefaultAsync(x => x.BookInvoiceId == invoiceId);
            if (pending != null)
                await ApiAsync("PATCH", $"appointments/{appointmentId}/check-in", reception, CheckIn(profile, pending.PatientBookId, true), 400, 4005);
            var issue = await ApiAsync("POST", $"book-invoices/{invoiceId}/issue-book", reception, new { bookNumber = number });
            var book = issue["patientBookId"]!.GetValue<int>();
            await ApiAsync("POST", $"book-invoices/{invoiceId}/issue-book", reception, new { bookNumber = number + "-again" }, 409, 4008);
            check(await db.PatientBooks.CountAsync(x => x.BookInvoiceId == invoiceId) == 1,
                "C9 one Paid invoice issues exactly one numbered book");
            return book;
        }

        private async Task ExamineAsync(int appointmentId, Patient profile, int bookId)
        {
            await ApiAsync("POST", "medical-records", doctor, Record(appointmentId, bookId), 400, 4005);
            await ApiAsync("PATCH", $"appointments/{appointmentId}/check-in", reception, CheckIn(profile, bookId, false), 400, 4005);
            await using var signal = await C8C9LiveEvents.ConnectAsync(client.BaseAddress!, doctor);
            var arrived = await ApiAsync("PATCH", $"appointments/{appointmentId}/check-in", reception, CheckIn(profile, bookId, true));
            check(arrived["checkedInAt"] != null && arrived["bookVerifiedAt"] != null && arrived["status"]!.GetValue<string>() == "Confirmed",
                "C9 checked-in/verified waiting state is stored without inventing a new appointment status");
            await signal.WaitAsync("CheckInChanged", "appointmentId", appointmentId);
            var queue = await ApiAsync("GET", $"medical-records/queue?date={today:yyyy-MM-dd}&pageSize=100", doctor);
            check(queue["items"]!.AsArray().Any(x => x!["appointmentId"]!.GetValue<int>() == appointmentId),
                "C9 the assigned doctor's real examination queue includes the checked-in appointment");
            await ApiAsync("PATCH", $"appointments/{appointmentId}/start-examination", wrongDoctor, status: 403);
            await ApiAsync("POST", "medical-records", reception, Record(appointmentId, bookId), 403);
            await ApiAsync("PATCH", $"appointments/{appointmentId}/start-examination", doctor);
            var record = await ApiAsync("POST", "medical-records", doctor, Record(appointmentId, bookId), 201);
            var recordId = record["medicalRecordId"]!.GetValue<int>();
            check(record["patientBookId"]!.GetValue<int>() == bookId && record["patientProfileId"]!.GetValue<int>() == profile.PatientId
                && record["appointmentId"]!.GetValue<int>() == appointmentId && record["status"]!.GetValue<string>() == "InProgress",
                "C9 MedicalRecord preserves the exact appointment/profile/verified-book relationship");
            await ApiAsync("POST", "medical-records", doctor, Record(appointmentId, bookId), 409);
            if (!verifiedInUse)
            {
                var inUse = await ApiAsync("POST", $"patients/{profile.PatientId}/book-invoices", reception, new { amount = 10000 });
                var inUseId = inUse["bookInvoiceId"]!.GetValue<int>();
                await ApiAsync("PATCH", $"book-invoices/{inUseId}/pay", cashier);
                await ApiAsync("POST", $"book-invoices/{inUseId}/issue-book", reception, new { bookNumber = "C9-INUSE-" + appointmentId }, 409, 4010);
                verifiedInUse = true;
            }
            await ApiAsync("PUT", $"medical-records/{recordId}", doctor, new { expectedUpdatedAt = record["updatedAt"]!.GetValue<DateTime>(),
                symptoms = "C9 verification symptoms", conclusion = "C9 test completed", patientBookId = bookId,
                markCompleted = true, paperBookConfirmed = true, diagnoses = new[] { new { diseaseId, isPrimary = true } } });
            await ApiAsync("PATCH", $"appointments/{appointmentId}/cancel", reception, status: 400, code: 5003);
            await ApiAsync("PATCH", $"appointments/{appointmentId}/start-examination", doctor, status: 400, code: 5003);
            check(await db.MedicalRecords.AsNoTracking().CountAsync(x => x.AppointmentId == appointmentId) == 1
                && await db.Appointments.AsNoTracking().AnyAsync(x => x.AppointmentId == appointmentId && x.Status == "Completed"),
                "C9 the examination completes once and keeps one medical record");
        }

        public async Task VerifyInvoiceMigrationAsync()
        {
            db.ChangeTracker.Clear();
            var legacy = new Invoice { PatientId = patientUserId, CashierId = cashierUserId, AppointmentId = null,
                TotalAmount = 100000, InsuranceDiscountPercent = 63.25m, InsuranceAmount = 63250, PatientAmount = 36750 };
            db.Invoices.Add(legacy);
            await db.SaveChangesAsync();
            var migrator = db.GetService<IMigrator>();
            await migrator.MigrateAsync("20261013024927_SeedDepartmentHeadRole");
            var preserved = await db.Database.SqlQuery<int>($"SELECT COUNT(*) AS Value FROM Invoices WHERE Id={legacy.Id} AND AppointmentId IS NULL AND InsuranceDiscountPercent=63.25 AND InsuranceAmount=63250 AND PatientAmount=36750").SingleAsync();
            check(preserved == 1, "C8/C9 invoice migration rollback preserves nullable appointment and insurance values");
            await db.Database.MigrateAsync();
            db.ChangeTracker.Clear();
            check(await db.Invoices.AsNoTracking().AnyAsync(x => x.Id == legacy.Id && x.AppointmentId == null
                && x.InsuranceDiscountPercent == 63.25m && x.InsuranceAmount == 63250m && x.PatientAmount == 36750m),
                "C8/C9 invoice migration reapplies without duplicate columns or financial data loss");
        }

        public async Task<UiFixture> CreateUiFixtureAsync()
        {
            var profile = await NewProfileAsync("C9 UI web arrival", "0909000999");
            var id = await SeedArrivalAsync(profile, "C9 UI arrival", 6, patientUserId);
            return new(today.ToString("yyyy-MM-dd"), today.AddDays(5).ToString("yyyy-MM-dd"), 1,
                await db.Doctors.Where(x => x.DoctorId == 1).Select(x => x.FullName).SingleAsync(),
                await db.Doctors.Where(x => x.DoctorId == 1).Select(x => x.Department.Name).SingleAsync(), id, profile.FullName, profile.PatientId);
        }

        private async Task<Patient> NewProfileAsync(string name, string phone)
        {
            var profile = new Patient { FullName = name, Phone = phone, CreatedAt = DateTime.UtcNow };
            db.Patients.Add(profile);
            await db.SaveChangesAsync();
            return profile;
        }
        private async Task<int> ExistingBookAsync(Patient profile, string number) =>
            (await ApiAsync("POST", $"patients/{profile.PatientId}/books/existing", reception,
                new { bookNumber = number, bookPresented = true }))["patientBookId"]!.GetValue<int>();
        private async Task<int> SeedArrivalAsync(Patient profile, string reason, double hour, int? userId = null)
        {
            var row = new Appointment { DoctorId = 1, PatientId = userId, PatientProfileId = profile.PatientId,
                PatientName = profile.FullName, PatientPhone = profile.Phone, AppointmentDate = today, StartTime = TimeSpan.FromHours(hour),
                EndTime = TimeSpan.FromHours(hour + .5), Status = "Confirmed", Reason = reason, CreatedAt = DateTime.UtcNow };
            db.Appointments.Add(row);
            await db.SaveChangesAsync();
            return row.AppointmentId;
        }
        private DateTime ArrivalDate() => Now.Hour < 20 ? today : today.AddDays(1);
        private string ArrivalTime() => TimeSpan.FromHours(20 + arrivalIndex++ * .5).ToString();
        private async Task NormalizeArrivalDateAsync(int id)
        {
            if (ArrivalDate() == today) return;
            // A late-night run simulates arrival on the next day in this disposable DB only.
            await db.Appointments.Where(x => x.AppointmentId == id).ExecuteUpdateAsync(s => s.SetProperty(x => x.AppointmentDate, today));
            Console.WriteLine("NOTE C9 late-night fixture simulates the booked arrival day; application clock is unchanged.");
        }
        private static int Id(JsonNode row) => row["appointmentId"]!.GetValue<int>();
        private static object Booking(DateTime date, string time, string name, string phone) => new
            { doctorId = 1, appointmentDate = date, startTime = time, patientName = name, patientPhone = phone, reason = "C8/C9 verification" };
        private static object Direct(DateTime date, string time, Patient profile, bool match = true) => new
            { doctorId = 1, appointmentDate = date, startTime = time, patientName = profile.FullName, patientPhone = profile.Phone,
                patientProfileId = match ? profile.PatientId : (int?)null, reason = "C8/C9 verification" };
        private static object CheckIn(Patient profile, int bookId, bool presented) => new
            { patientProfileId = profile.PatientId, patientBookId = bookId, bookPresented = presented };
        private static object Record(int id, int book) => new { appointmentId = id, symptoms = "C9 verification symptoms", patientBookId = book };
        private async Task<bool> SlotAvailableAsync(DateTime date, string time) =>
            (await ApiAsync("GET", $"appointments/available-slots?doctorId=1&date={date:yyyy-MM-dd}", patient))
                .AsArray().Single(x => x!["startTime"]!.GetValue<string>() == time)!["isAvailable"]!.GetValue<bool>();
        private void CheckRace(Reply[] replies, string description) => check(replies.Count(x => x.Status == 200) == 1
            && replies.Count(x => x.Status == 409 && x.Data?["code"]?.GetValue<int>() == 5002) == replies.Length - 1,
            description + " => " + string.Join(",", replies.Select(x => x.Status)));
        private sealed record Reply(int Status, JsonNode? Data);
        private async Task<Reply> RequestAsync(string method, string path, string token, object? body = null)
        {
            using var request = new HttpRequestMessage(new HttpMethod(method), "api/" + path);
            if (token.Length > 0) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            return new((int)response.StatusCode, string.IsNullOrWhiteSpace(text) ? null : JsonNode.Parse(text));
        }
        private async Task<JsonNode> ApiAsync(string method, string path, string token, object? body = null, int status = 200, int? code = null)
        {
            var response = await RequestAsync(method, path, token, body);
            check(response.Status == status && (code == null || response.Data?["code"]?.GetValue<int>() == code),
                $"C8/C9 {method} {path}: {response.Status} expected {status}" + (code == null ? "" : $" code {response.Data?["code"]}/{code}"));
            return response.Data?["result"] ?? response.Data ?? new JsonObject();
        }
    }
}

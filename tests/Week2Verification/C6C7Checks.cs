using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Exceptions;
using Microsoft.EntityFrameworkCore;

internal static class C6C7Checks
{
    private static DateTime Today => TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
        DateTime.UtcNow, "Asia/Ho_Chi_Minh").Date;

    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password,
        Action<bool, string> check)
    {
        async Task<JsonNode?> Send(HttpMethod method, string path, string token = "", object? body = null, int status = 200)
        {
            using var request = new HttpRequestMessage(method, path);
            if (token.Length > 0) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status,
                $"C6/C7 {method} {path}: {(int)response.StatusCode} (expected {status})"
                + ((int)response.StatusCode == status ? "" : $" {text}"));
            return string.IsNullOrEmpty(text) ? null : JsonNode.Parse(text);
        }
        async Task<JsonNode> LoginAsync(string name) => (await Send(HttpMethod.Post, "api/auth/login", body:
            new { username = name, password }))!["result"]!;
        static HashSet<int> Ids(JsonNode result) => result["items"]!.AsArray()
            .Select(x => x!["appointmentId"]!.GetValue<int>()).ToHashSet();

        var (patient, otherPatient) = await EnsureUsersAsync(db, password);
        var date = Today.AddDays(5);
        await EnsureSchedulesAsync(db, date);
        var profile = new Patient { UserId = patient.UserId, FullName = "C6 patient", Phone = "0900111001", CreatedAt = DateTime.UtcNow };
        var otherProfile = new Patient { UserId = otherPatient.UserId, FullName = "C6 other patient", Phone = "0900111002", CreatedAt = DateTime.UtcNow };
        db.Patients.AddRange(profile, otherProfile);
        await db.SaveChangesAsync();
        var patientLogin = await LoginAsync(patient.Username);
        var ownToken = patientLogin["accessToken"]!.GetValue<string>();
        var otherToken = (await LoginAsync(otherPatient.Username))["accessToken"]!.GetValue<string>();
        var reception = (await LoginAsync("testreceptionist"))["accessToken"]!.GetValue<string>();
        var doctor = (await LoginAsync("testdoctor"))["accessToken"]!.GetValue<string>();
        check(patientLogin["permissions"]!.AsArray().Any(x => x!.GetValue<string>() == PermissionCodes.AppointmentsViewOwn),
            "Patient login includes the own-appointments permission");
        check(await db.Permissions.AnyAsync(x => x.Code == PermissionCodes.AppointmentsViewOwn && x.IsImplemented),
            "Own-appointments permission migration applies without adding any new permission");

        object Booking(string time, int? forgedPatientId = null) => new { doctorId = 1, appointmentDate = date.ToString("yyyy-MM-dd"),
            startTime = time, patientName = profile.FullName, patientPhone = profile.Phone,
            reason = "C6/C7 verification", patientId = forgedPatientId, patientBookId = (int?)null };
        var own = (await Send(HttpMethod.Post, "api/appointments", ownToken, Booking("08:00:00", otherPatient.UserId)))!["result"]!;
        var ownId = own["appointmentId"]!.GetValue<int>();
        check(own["patientBookId"] == null && own["bookVerifiedAt"] == null && own["checkedInAt"] == null
            && await db.Appointments.AsNoTracking().AnyAsync(x => x.AppointmentId == ownId && x.PatientId == patient.UserId),
            "Web booking requires no book and ignores forged client ownership");
        var otherId = (await Send(HttpMethod.Post, "api/appointments", otherToken, Booking("08:30:00")))!["result"]!["appointmentId"]!.GetValue<int>();
        var linkedWalkIn = Appointment(1, null, profile.PatientId, profile.FullName, profile.Phone, date, 9, "Confirmed");
        var otherLinkedBooking = Appointment(1, otherPatient.UserId, profile.PatientId, profile.FullName, profile.Phone, date, 9.5, "Confirmed");
        var clinical = Appointment(1, patient.UserId, profile.PatientId, profile.FullName, profile.Phone, Today, 23, "Confirmed");
        var unpaidClinical = Appointment(2, otherPatient.UserId, otherProfile.PatientId, otherProfile.FullName, otherProfile.Phone, Today, 23, "Confirmed");
        db.Appointments.AddRange(linkedWalkIn, otherLinkedBooking, clinical, unpaidClinical);
        await db.SaveChangesAsync();

        await Send(HttpMethod.Get, "api/appointments/mine", status: 401);
        await Send(HttpMethod.Get, "api/appointments/mine", reception, status: 403);
        await Send(HttpMethod.Get, "api/appointments/mine", doctor, status: 403);
        await Send(HttpMethod.Get, "api/appointments", ownToken, status: 403);
        var mine = (await Send(HttpMethod.Get, $"api/appointments/mine?patientId={otherPatient.UserId}&userId={otherPatient.UserId}", ownToken))!["result"]!;
        check(Ids(mine).SetEquals(new[] { ownId, linkedWalkIn.AppointmentId, clinical.AppointmentId }),
            "Own list includes linked walk-ins and excludes other accounts even when a profile or name is shared");
        var theirs = (await Send(HttpMethod.Get, "api/appointments/mine", otherToken))!["result"]!;
        check(Ids(theirs).SetEquals(new[] { otherId, otherLinkedBooking.AppointmentId, unpaidClinical.AppointmentId }),
            "Another patient only sees their own authenticated appointments");
        var filtered = (await Send(HttpMethod.Get,
            $"api/appointments/mine?dateFrom={date:yyyy-MM-dd}&dateTo={date:yyyy-MM-dd}&status=Confirmed&doctorId=1&search=C6", ownToken))!["result"]!;
        check(Ids(filtered).SetEquals(new[] { linkedWalkIn.AppointmentId }), "Own list combines date, status, doctor and search filters");
        var paged = (await Send(HttpMethod.Get, "api/appointments/mine?pageNumber=2&pageSize=1", ownToken))!["result"]!;
        check(paged["items"]!.AsArray().Count == 1 && paged["pageNumber"]!.GetValue<int>() == 2
            && paged["totalItems"]!.GetValue<int>() == 3 && paged["totalPages"]!.GetValue<int>() == 3,
            "Own pagination counts only the authenticated patient's records");
        await Send(HttpMethod.Get, "api/appointments/mine?status=Invalid", ownToken, status: 400);
        await Send(HttpMethod.Get, $"api/appointments/mine?dateFrom={date:yyyy-MM-dd}&dateTo={Today:yyyy-MM-dd}", ownToken, status: 400);
        await Send(HttpMethod.Patch, $"api/appointments/{ownId}/confirm", reception);
        var confirmed = (await Send(HttpMethod.Get, "api/appointments/mine?status=Confirmed", ownToken))!["result"]!;
        check(Ids(confirmed).Contains(ownId), "Own list reflects reception confirmation");
        await Send(HttpMethod.Patch, $"api/appointments/{ownId}/cancel", reception);
        var cancelled = (await Send(HttpMethod.Get, "api/appointments/mine?status=Cancelled", ownToken))!["result"]!;
        check(Ids(cancelled).SetEquals(new[] { ownId }), "Own history retains cancelled appointments");
        var receptionFiltered = (await Send(HttpMethod.Get,
            $"api/appointments?dateFrom={Today:yyyy-MM-dd}&dateTo={Today:yyyy-MM-dd}&doctorId=1&status=Confirmed&search=C6", reception))!["result"]!;
        check(Ids(receptionFiltered).SetEquals(new[] { clinical.AppointmentId }), "Reception filters combine date, status, doctor and search");
        await VerifyBookingInputBoundariesAsync(Send, check, ownToken, reception, linkedWalkIn.AppointmentId, profile);

        var invoiceId = (await Send(HttpMethod.Post, $"api/patients/{profile.PatientId}/book-invoices", reception,
            new { amount = 10000 }))!["result"]!["bookInvoiceId"]!.GetValue<int>();
        await Send(HttpMethod.Post, $"api/book-invoices/{invoiceId}/issue-book", reception, new { bookNumber = "C6-FIRST" }, 409);
        await Send(HttpMethod.Patch, $"api/book-invoices/{invoiceId}/pay", reception);
        var pendingBook = await db.PatientBooks.AsNoTracking().SingleAsync(x => x.BookInvoiceId == invoiceId);
        check(pendingBook.Status == "Pending", "Paid creates a Pending book, not an automatically verified Issued book");
        await Send(HttpMethod.Patch, $"api/appointments/{clinical.AppointmentId}/check-in", reception,
            new { patientProfileId = profile.PatientId, patientBookId = pendingBook.PatientBookId, bookPresented = true }, 400);
        var firstId = (await Send(HttpMethod.Post, $"api/book-invoices/{invoiceId}/issue-book", reception,
            new { bookNumber = "C6-FIRST" }))!["result"]!["patientBookId"]!.GetValue<int>();
        check(firstId == pendingBook.PatientBookId && await db.PatientBooks.CountAsync(x => x.BookInvoiceId == invoiceId) == 1,
            "Issuing reuses the Paid Pending book and records exactly one book per invoice");
        await Send(HttpMethod.Post, $"api/book-invoices/{invoiceId}/issue-book", reception, new { bookNumber = "C6-DUPLICATE" }, 409);
        await Send(HttpMethod.Patch, $"api/appointments/{clinical.AppointmentId}/check-in", reception,
            new { patientProfileId = profile.PatientId, patientBookId = firstId, bookPresented = false }, 400);
        check(await db.Appointments.AsNoTracking().AnyAsync(x => x.AppointmentId == clinical.AppointmentId && x.CheckedInAt == null),
            "A Paid Issued book still requires physical verification before check-in");

        // A forged/legacy Issued book linked to an Unpaid invoice must also fail on the server.
        var unpaidInvoice = new BookInvoice { PatientId = otherProfile.PatientId, Amount = 10000, Status = "Unpaid", CreatedAt = DateTime.UtcNow };
        db.BookInvoices.Add(unpaidInvoice);
        await db.SaveChangesAsync();
        var unpaidBook = new PatientBook { PatientId = otherProfile.PatientId, BookInvoiceId = unpaidInvoice.BookInvoiceId,
            BookNumber = "C6-UNPAID", Status = "Issued", IssuedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        db.PatientBooks.Add(unpaidBook);
        await db.SaveChangesAsync();
        await Send(HttpMethod.Patch, $"api/appointments/{unpaidClinical.AppointmentId}/check-in", reception,
            new { patientProfileId = otherProfile.PatientId, patientBookId = unpaidBook.PatientBookId, bookPresented = true }, 400);
        check(await db.Appointments.AsNoTracking().AnyAsync(x => x.AppointmentId == unpaidClinical.AppointmentId && x.CheckedInAt == null),
            "An Unpaid invoice blocks check-in even if its book was marked Issued");

        var replacementInvoiceId = (await Send(HttpMethod.Post, $"api/patients/{profile.PatientId}/book-invoices", reception,
            new { amount = 15000 }))!["result"]!["bookInvoiceId"]!.GetValue<int>();
        await Send(HttpMethod.Patch, $"api/book-invoices/{replacementInvoiceId}/pay", reception);
        await Send(HttpMethod.Post, $"api/book-invoices/{replacementInvoiceId}/issue-book", reception,
            new { bookNumber = "C6-FIRST" }, 409);
        check(await db.PatientBooks.AsNoTracking().AnyAsync(x => x.PatientBookId == firstId && x.Status == "Issued")
            && await db.PatientBooks.AsNoTracking().AnyAsync(x => x.BookInvoiceId == replacementInvoiceId && x.Status == "Pending"),
            "A conflicting replacement number rolls back retirement and leaves the Paid book Pending");
        var replacementId = (await Send(HttpMethod.Post, $"api/book-invoices/{replacementInvoiceId}/issue-book", reception,
            new { bookNumber = "C6-REPLACED" }))!["result"]!["patientBookId"]!.GetValue<int>();
        check(await db.PatientBooks.AsNoTracking().AnyAsync(x => x.PatientBookId == firstId && x.Status == "Replaced")
            && await db.PatientBooks.AsNoTracking().AnyAsync(x => x.PatientBookId == replacementId && x.PreviousBookId == firstId)
            && await db.PatientBooks.CountAsync(x => x.PatientId == profile.PatientId && x.Status == "Issued") == 1,
            "Paid reissue links the previous book, retires it and keeps one Issued book");
        await Send(HttpMethod.Patch, $"api/appointments/{clinical.AppointmentId}/check-in", reception,
            new { patientProfileId = profile.PatientId, patientBookId = firstId, bookPresented = true }, 400);
        await Send(HttpMethod.Patch, $"api/appointments/{clinical.AppointmentId}/check-in", reception,
            new { patientProfileId = profile.PatientId, patientBookId = replacementId, bookPresented = true });
        var checkedIn = (await Send(HttpMethod.Get, $"api/appointments/mine?dateFrom={Today:yyyy-MM-dd}&dateTo={Today:yyyy-MM-dd}", ownToken))!["result"]!["items"]!.AsArray().Single()!;
        check(checkedIn["checkedInAt"] != null && checkedIn["bookVerifiedAt"] != null && checkedIn["patientBookId"]!.GetValue<int>() == replacementId,
            "Own appointment includes verified check-in state without changing slot status");
        await Send(HttpMethod.Patch, $"api/appointments/{clinical.AppointmentId}/check-in", reception,
            new { patientProfileId = profile.PatientId, patientBookId = replacementId, bookPresented = true }, 400);
        var inUseInvoiceId = (await Send(HttpMethod.Post, $"api/patients/{profile.PatientId}/book-invoices", reception,
            new { amount = 15000 }))!["result"]!["bookInvoiceId"]!.GetValue<int>();
        await Send(HttpMethod.Patch, $"api/book-invoices/{inUseInvoiceId}/pay", reception);
        var blocked = await Send(HttpMethod.Post, $"api/book-invoices/{inUseInvoiceId}/issue-book", reception,
            new { bookNumber = "C6-IN-USE" }, 409);
        check(blocked!["code"]!.GetValue<int>() == 4010
            && await db.PatientBooks.AsNoTracking().AnyAsync(x => x.PatientBookId == replacementId && x.Status == "Issued"),
            "Reissue cannot retire a book being used by an unfinished checked-in examination");

        var lostProfile = new Patient { FullName = "C6 lost book patient", Phone = "0900111003", CreatedAt = DateTime.UtcNow };
        db.Patients.Add(lostProfile);
        await db.SaveChangesAsync();
        var lostBook = new PatientBook { PatientId = lostProfile.PatientId, BookNumber = "C6-LOST", Status = "Lost",
            IssuedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        db.PatientBooks.Add(lostBook);
        await db.SaveChangesAsync();
        var lostInvoiceId = (await Send(HttpMethod.Post, $"api/patients/{lostProfile.PatientId}/book-invoices", reception,
            new { amount = 15000 }))!["result"]!["bookInvoiceId"]!.GetValue<int>();
        await Send(HttpMethod.Patch, $"api/book-invoices/{lostInvoiceId}/pay", reception);
        var lostPendingBook = await db.PatientBooks.SingleAsync(x => x.BookInvoiceId == lostInvoiceId);
        lostPendingBook.PreviousBookId = lostBook.PatientBookId;
        await db.SaveChangesAsync();
        var recovered = (await Send(HttpMethod.Post, $"api/book-invoices/{lostInvoiceId}/issue-book", reception,
            new { bookNumber = "C6-RECOVERED" }))!["result"]!;
        check(recovered["previousBookId"]!.GetValue<int>() == lostBook.PatientBookId
            && await db.PatientBooks.AsNoTracking().AnyAsync(x => x.PatientBookId == lostPendingBook.PatientBookId
                && x.Status == "Issued" && x.PreviousBookId == lostBook.PatientBookId)
            && await db.PatientBooks.AsNoTracking().AnyAsync(x => x.PatientBookId == lostBook.PatientBookId && x.Status == "Lost"),
            "Paid Pending issuance preserves its existing Lost-book history when there is no Issued book to retire");

        var staleInvoiceId = (await Send(HttpMethod.Post, $"api/patients/{lostProfile.PatientId}/book-invoices", reception,
            new { amount = 15000 }))!["result"]!["bookInvoiceId"]!.GetValue<int>();
        await Send(HttpMethod.Patch, $"api/book-invoices/{staleInvoiceId}/pay", reception);
        var stalePendingBook = await db.PatientBooks.SingleAsync(x => x.BookInvoiceId == staleInvoiceId);
        stalePendingBook.PreviousBookId = lostBook.PatientBookId;
        await db.SaveChangesAsync();
        var currentIssuedId = recovered["patientBookId"]!.GetValue<int>();
        var newest = (await Send(HttpMethod.Post, $"api/book-invoices/{staleInvoiceId}/issue-book", reception,
            new { bookNumber = "C6-LATEST-REISSUE" }))!["result"]!;
        check(newest["previousBookId"]!.GetValue<int>() == currentIssuedId
            && await db.PatientBooks.AsNoTracking().AnyAsync(x => x.PatientBookId == currentIssuedId && x.Status == "Replaced")
            && await db.PatientBooks.AsNoTracking().AnyAsync(x => x.PatientBookId == lostBook.PatientBookId && x.Status == "Lost")
            && await db.PatientBooks.CountAsync(x => x.PatientId == lostProfile.PatientId && x.Status == "Issued") == 1,
            "A stale Pending request links the current Issued book it retires instead of skipping it in book history");
    }

    private static async Task VerifyBookingInputBoundariesAsync(
        Func<HttpMethod, string, string, object?, int, Task<JsonNode?>> send,
        Action<bool, string> check, string ownToken, string reception, int appointmentId, Patient profile)
    {
        foreach (var (path, token) in new[] { ("api/appointments/mine", ownToken), ("api/appointments", reception) })
        {
            var rejected = await send(HttpMethod.Get, path + "?pageNumber=2147483647&pageSize=100", token, null, 400);
            check(rejected?["code"]?.GetValue<int>() == ErrorCode.INVALID_REQUEST.Code,
                "Appointment pagination rejects an overflowing SQL offset with a business error");
            var highestValidPage = int.MaxValue / 100 + 1;
            var valid = await send(HttpMethod.Get, path + $"?pageNumber={highestValidPage}&pageSize=100", token, null, 200);
            check(valid!["result"]!["items"]!.AsArray().Count == 0,
                "A valid large appointment offset remains an empty page instead of an overflow rejection");
        }

        foreach (var boundary in new[]
        {
            (Date: DateTime.MinValue, Time: TimeSpan.FromSeconds(-1)),
            (Date: DateTime.MaxValue.Date, Time: TimeSpan.FromDays(2))
        })
        {
            var request = new { doctorId = 1, appointmentDate = boundary.Date, startTime = boundary.Time,
                patientName = profile.FullName, patientPhone = profile.Phone, reason = "C6 invalid time boundary" };
            foreach (var (path, token) in new[] { ("api/appointments", ownToken), ("api/appointments/direct", reception) })
            {
                var rejected = await send(HttpMethod.Post, path, token, request, 400);
                check(rejected?["code"]?.GetValue<int>() == ErrorCode.INVALID_REQUEST.Code,
                    "Web/walk-in booking rejects out-of-day times before DateTime arithmetic can overflow");
            }

            var reschedule = await send(HttpMethod.Patch, $"api/appointments/{appointmentId}/reschedule", reception,
                new { doctorId = 1, appointmentDate = boundary.Date, startTime = boundary.Time }, 400);
            check(reschedule?["code"]?.GetValue<int>() == ErrorCode.INVALID_REQUEST.Code,
                "Rescheduling rejects invalid time boundaries with a business error instead of 500");
        }
    }

    public static async Task<object> SeedUiAsync(ApplicationDbContext db, string password)
    {
        var (patient, otherPatient) = await EnsureUsersAsync(db, password);
        // Only remove this suite's own fixtures before creating the browser scenarios.
        db.Appointments.RemoveRange(await db.Appointments.Where(x => x.Reason == "C6/C7 verification").ToListAsync());
        await db.SaveChangesAsync();
        var date = Today.AddDays(5);
        await EnsureSchedulesAsync(db, date);
        var newProfile = new Patient { FullName = "C6 UI chưa có sổ", Phone = "0900222001", CreatedAt = DateTime.UtcNow };
        var existingProfile = new Patient { FullName = "C6 UI có sổ", Phone = "0900222002", CreatedAt = DateTime.UtcNow };
        var paidProfile = new Patient { FullName = "C6 UI Paid", Phone = "0900222003", CreatedAt = DateTime.UtcNow };
        db.Patients.AddRange(newProfile, existingProfile, paidProfile);
        await db.SaveChangesAsync();
        var existingBook = new PatientBook { PatientId = existingProfile.PatientId, BookNumber = "C6-UI-EXISTING", Status = "Issued",
            IssuedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var previousBook = new PatientBook { PatientId = paidProfile.PatientId, BookNumber = "C6-UI-OLD", Status = "Issued",
            IssuedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var paidInvoice = new BookInvoice { PatientId = paidProfile.PatientId, Amount = 20000, Status = "Paid", PaidAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow };
        db.PatientBooks.AddRange(existingBook, previousBook);
        db.BookInvoices.Add(paidInvoice);
        await db.SaveChangesAsync();
        var pendingBook = new PatientBook { PatientId = paidProfile.PatientId, BookInvoiceId = paidInvoice.BookInvoiceId,
            BookNumber = $"PENDING-{paidInvoice.BookInvoiceId}", Status = "Pending", IssuedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var own = Appointment(1, patient.UserId, null, "C6 UI lịch của tôi", "0900222010", date, 10, "Pending");
        var other = Appointment(2, otherPatient.UserId, null, "C6 UI bệnh nhân khác", "0900222011", date, 10, "Pending");
        var newAppointment = Appointment(1, patient.UserId, newProfile.PatientId, newProfile.FullName, newProfile.Phone, Today, 22.5, "Confirmed");
        var existingAppointment = Appointment(1, patient.UserId, existingProfile.PatientId, existingProfile.FullName, existingProfile.Phone, Today, 23, "Confirmed");
        var paidAppointment = Appointment(1, patient.UserId, paidProfile.PatientId, paidProfile.FullName, paidProfile.Phone, Today, 22, "Confirmed");
        foreach (var item in new[] { own, other, newAppointment, existingAppointment, paidAppointment }) item.Reason = "C6/C7 UI verification";
        db.PatientBooks.Add(pendingBook);
        db.Appointments.AddRange(own, other, newAppointment, existingAppointment, paidAppointment);
        await db.SaveChangesAsync();
        return new
        {
            today = Today.ToString("yyyy-MM-dd"), date = date.ToString("yyyy-MM-dd"), futureDate = date.ToString("yyyy-MM-dd"),
            patientUsername = patient.Username, otherPatientUsername = otherPatient.Username,
            receptionUsername = "testreceptionist", otherReceptionUsername = "testreceptionist",
            doctorId = 1, doctorId2 = 2,
            doctorName = await db.Doctors.Where(x => x.DoctorId == 1).Select(x => x.FullName).SingleAsync(),
            doctorName2 = await db.Doctors.Where(x => x.DoctorId == 2).Select(x => x.FullName).SingleAsync(),
            departmentName = await db.Departments.Where(x => x.DepartmentId == 1).Select(x => x.Name).SingleAsync(),
            ownAppointmentId = own.AppointmentId, ownPatientName = own.PatientName,
            otherAppointmentId = other.AppointmentId, otherPatientName = other.PatientName,
            newAppointmentId = newAppointment.AppointmentId, newPatientId = newProfile.PatientId, newPatientName = newProfile.FullName,
            existingAppointmentId = existingAppointment.AppointmentId, existingPatientId = existingProfile.PatientId,
            existingPatientName = existingProfile.FullName, existingBookId = existingBook.PatientBookId, existingBookNumber = existingBook.BookNumber,
            paidAppointmentId = paidAppointment.AppointmentId, paidPatientId = paidProfile.PatientId, paidPatientName = paidProfile.FullName,
            paidInvoiceId = paidInvoice.BookInvoiceId, pendingBookId = pendingBook.PatientBookId,
            pendingPreviousBookNumber = previousBook.BookNumber
        };
    }

    private static Appointment Appointment(int doctorId, int? userId, int? profileId, string name, string phone,
        DateTime date, double hour, string status) => new()
    {
        DoctorId = doctorId, PatientId = userId, PatientProfileId = profileId,
        PatientName = name, PatientPhone = phone, AppointmentDate = date,
        StartTime = TimeSpan.FromHours(hour), EndTime = TimeSpan.FromHours(hour + 0.5),
        Status = status, Reason = "C6/C7 verification", CreatedAt = DateTime.UtcNow
    };

    private static async Task<(User Patient, User Other)> EnsureUsersAsync(ApplicationDbContext db, string password)
    {
        var roleId = await db.Roles.Where(x => x.RoleName == RoleConstants.Patient).Select(x => x.RoleId).SingleAsync();
        var users = new List<User>();
        foreach (var name in new[] { "c6patient", "c6otherpatient" })
        {
            var user = await db.Users.SingleOrDefaultAsync(x => x.Username == name);
            if (user == null)
            {
                user = new User { Username = name, FullName = name, RoleId = roleId,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), CreatedAt = DateTime.UtcNow };
                db.Users.Add(user);
            }
            users.Add(user);
        }
        await db.SaveChangesAsync();
        return (users[0], users[1]);
    }

    private static async Task EnsureSchedulesAsync(ApplicationDbContext db, DateTime date)
    {
        foreach (var id in new[] { 1, 2 })
        {
            if (await db.DoctorSchedules.AnyAsync(x => x.DoctorId == id && x.WorkDate == DateOnly.FromDateTime(date))) continue;
            var schedule = new DoctorSchedule { DoctorId = id, RoomId = id, WorkDate = DateOnly.FromDateTime(date),
                StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(12), MaxPatients = 8,
                Status = "Approved", CreatedAt = DateTime.UtcNow };
            for (var hour = 8.0; hour < 12; hour += 0.5)
                schedule.TimeSlots.Add(new TimeSlot { StartTime = TimeSpan.FromHours(hour), EndTime = TimeSpan.FromHours(hour + 0.5),
                    MaxCapacity = 1, IsAvailable = true });
            db.DoctorSchedules.Add(schedule);
        }
        await db.SaveChangesAsync();
    }
}

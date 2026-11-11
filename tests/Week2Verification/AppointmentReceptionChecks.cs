using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;

internal static class AppointmentReceptionChecks
{
    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password,
        Action<bool, string> check)
    {
        async Task<JsonNode?> Send(HttpMethod method, string path, string token = "", object? body = null, int status = 200)
        {
            using var request = new HttpRequestMessage(method, "api/" + path);
            if (token.Length > 0) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status, $"Hoang {method} {path}: {(int)response.StatusCode}, expected {status}"
                + ((int)response.StatusCode == status ? "" : " " + text));
            return JsonNode.Parse(text)?["result"];
        }
        async Task<JsonNode> Login(string name) => (await Send(HttpMethod.Post, "auth/login", body: new { username = name, password }))!;
        static string Token(JsonNode login) => login["accessToken"]!.GetValue<string>();
        static int Id(JsonNode item, string field) => item[field]!.GetValue<int>();

        check(!await db.Roles.AnyAsync(x => x.RoleName == RoleConstants.Cashier),
            "Hoang migration does not seed a Cashier role or its grants");
        var users = new[] { ("hoangpatient", 4), ("hoangother", 4) }
            .Select(x => new User { Username = x.Item1, FullName = x.Item1, RoleId = x.Item2,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), CreatedAt = DateTime.UtcNow }).ToArray();
        db.Users.AddRange(users);
        await db.SaveChangesAsync();
        var profile = new Patient { FullName = "Hoang verification", Phone = "0908007011", UserId = users[0].UserId, CreatedAt = DateTime.UtcNow };
        db.Patients.Add(profile);
        await db.SaveChangesAsync();
        var own = Token(await Login(users[0].Username));
        var other = Token(await Login(users[1].Username));
        var finance = Token(await Login("testadmin"));
        var receptionLogin = await Login("testreceptionist");
        var reception = Token(receptionLogin);
        var receptionId = Id(receptionLogin, "userId");
        var doctorLogin = await Login("testdoctor");
        var doctor = Token(doctorLogin);
        var doctorId = Id(doctorLogin, "userId");
        var future = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Asia/Ho_Chi_Minh").Date.AddDays(10);
        var schedule = new DoctorSchedule { DoctorId = 1, RoomId = 1, WorkDate = DateOnly.FromDateTime(future),
            StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(12), Status = "Approved", MaxPatients = 8, CreatedAt = DateTime.UtcNow };
        for (var hour = 8.0; hour < 12; hour += .5)
            schedule.TimeSlots.Add(new TimeSlot { StartTime = TimeSpan.FromHours(hour), EndTime = TimeSpan.FromHours(hour + .5), IsAvailable = true, MaxCapacity = 1 });
        db.DoctorSchedules.Add(schedule);
        await db.SaveChangesAsync();
        object Booking(string time) => new { doctorId = 1, appointmentDate = future.ToString("yyyy-MM-dd"), startTime = time,
            patientName = profile.FullName, patientPhone = profile.Phone, reason = "Hoang completion verification" };
        var appointment = (await Send(HttpMethod.Post, "appointments", own, Booking("08:00:00")))!;
        var appointmentId = Id(appointment, "appointmentId");
        await Send(HttpMethod.Patch, $"appointments/mine/{appointmentId}/cancel", status: 401);
        await Send(HttpMethod.Patch, $"appointments/mine/{appointmentId}/cancel", reception, status: 403);
        await Send(HttpMethod.Patch, $"appointments/mine/{appointmentId}/cancel", other, status: 403);
        var notificationsBefore = await db.Notifications.CountAsync();
        await Send(HttpMethod.Patch, $"appointments/mine/{appointmentId}/cancel", own);
        check(await db.Appointments.AsNoTracking().AnyAsync(x => x.AppointmentId == appointmentId && x.Status == "Cancelled"),
            "Own cancellation persists without deleting appointment history");
        var slots = (await Send(HttpMethod.Get, $"appointments/available-slots?doctorId=1&date={future:yyyy-MM-dd}", own))!.AsArray();
        check(slots.Any(x => x!["startTime"]!.GetValue<string>() == "08:00:00" && x["isAvailable"]!.GetValue<bool>()),
            "Own cancellation releases the slot");
        var afterCancellation = await db.Notifications.CountAsync();
        check(afterCancellation > notificationsBefore && await db.Notifications.AnyAsync(x => x.UserId == users[0].UserId
                && x.EventKey!.StartsWith($"appointment:{appointmentId}:Cancelled:")), "Cancellation remains in patient notification history");
        await Send(HttpMethod.Patch, $"appointments/mine/{appointmentId}/cancel", own, status: 400);
        check(await db.Notifications.CountAsync() == afterCancellation, "Failed repeated cancellation creates no notification");
        var history = (await Send(HttpMethod.Get, "notifications?pageSize=50", own))!;
        check(history["items"]!.AsArray().Count >= 2, "Created and cancelled appointments survive notification reload");
        check(!await db.Notifications.AnyAsync(x => x.UserId == users[1].UserId && x.Type == "Appointment"),
            "Appointment history does not leak to another patient");

        Appointment Fixture(double hour, string status = "Confirmed", int? owner = null, bool linked = false) => new()
        {
            DoctorId = 1, PatientId = linked ? null : owner ?? users[0].UserId, PatientProfileId = profile.PatientId,
            PatientName = profile.FullName, PatientPhone = profile.Phone, AppointmentDate = future,
            StartTime = TimeSpan.FromHours(hour), EndTime = TimeSpan.FromHours(hour + .5), Status = status,
            Reason = "Cancellation guard", CreatedAt = DateTime.UtcNow
        };
        var walkIn = Fixture(8.5, linked: true);
        var mismatchedOwner = Fixture(9, owner: users[1].UserId);
        var guardProfile = new Patient { FullName = "Cancellation guard", Phone = "0908007012", CreatedAt = DateTime.UtcNow };
        var guardBook = new PatientBook { Patient = guardProfile, BookNumber = "HOANG-GUARD", Status = "Issued", IssuedAt = DateTime.UtcNow };
        db.PatientBooks.Add(guardBook);
        await db.SaveChangesAsync();
        var checkedIn = Fixture(9.5);
        checkedIn.PatientProfileId = guardProfile.PatientId;
        checkedIn.PatientBookId = guardBook.PatientBookId;
        checkedIn.BookVerifiedAt = checkedIn.CheckedInAt = DateTime.UtcNow;
        var inProgress = Fixture(10, "InProgress");
        var completed = Fixture(10.5, "Completed");
        var past = Fixture(11); past.AppointmentDate = future.AddDays(-20);
        db.Appointments.AddRange(walkIn, mismatchedOwner, checkedIn, inProgress, completed, past);
        await db.SaveChangesAsync();
        await Send(HttpMethod.Patch, $"appointments/mine/{walkIn.AppointmentId}/cancel", own);
        await Send(HttpMethod.Patch, $"appointments/mine/{mismatchedOwner.AppointmentId}/cancel", own, status: 403);
        foreach (var blocked in new[] { checkedIn, inProgress, completed, past })
            await Send(HttpMethod.Patch, $"appointments/mine/{blocked.AppointmentId}/cancel", own, status: 400);
        var revocable = await db.RolePermissions.SingleAsync(x => x.RoleId == 4 && x.PermissionCode == PermissionCodes.AppointmentsCancelOwn);
        db.RolePermissions.Remove(revocable); await db.SaveChangesAsync();
        await Send(HttpMethod.Patch, $"appointments/mine/{mismatchedOwner.AppointmentId}/cancel", own, status: 403);
        db.RolePermissions.Add(revocable); await db.SaveChangesAsync();

        var changing = (await Send(HttpMethod.Post, "appointments", own, Booking("11:00:00")))!;
        var changingId = Id(changing, "appointmentId");
        await Send(HttpMethod.Patch, $"appointments/{changingId}/confirm", reception);
        await Send(HttpMethod.Patch, $"appointments/{changingId}/reschedule", reception,
            new { doctorId = 1, appointmentDate = future.ToString("yyyy-MM-dd"), startTime = "11:30:00" });
        foreach (var change in new[] { "Created", "Confirmed", "Rescheduled" })
            check(await db.Notifications.AnyAsync(x => x.UserId == users[0].UserId && x.EventKey!.StartsWith($"appointment:{changingId}:{change}:")),
                $"{change} has a persistent notification for the owner");

        await Send(HttpMethod.Post, $"patients/{profile.PatientId}/book-requests", own, new { reason = "New" }, 403);
        await Send(HttpMethod.Post, $"patients/{profile.PatientId}/book-requests", reception, new { reason = "Invalid" }, 400);
        var concurrentRequests = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => Send(HttpMethod.Post,
            $"patients/{profile.PatientId}/book-requests", reception, new { reason = "New" })));
        var request = concurrentRequests[0]!;
        var requestId = Id(request, "patientBookRequestId");
        check(concurrentRequests.All(x => Id(x!, "patientBookRequestId") == requestId)
            && await db.PatientBookRequests.CountAsync(x => x.PatientId == profile.PatientId) == 1,
            "Concurrent reception requests create one open request without a 500");
        check(request["status"]!.GetValue<string>() == "Pending" && request["bookInvoiceId"] == null
            && !await db.BookInvoices.AnyAsync(x => x.PatientId == profile.PatientId), "Reception request creates no invoice or payment");
        var retry = (await Send(HttpMethod.Post, $"patients/{profile.PatientId}/book-requests", reception, new { reason = "New" }))!;
        check(Id(retry, "patientBookRequestId") == requestId, "Request retries reuse the open request");
        await Send(HttpMethod.Get, $"patients/{profile.PatientId}/book-requests", doctor, status: 403);
        await Send(HttpMethod.Get, $"patients/{profile.PatientId}/book-requests", own, status: 403);
        var queue = (await Send(HttpMethod.Get, $"patients/{profile.PatientId}/book-requests?pageSize=1", reception))!;
        check(Id(queue, "totalItems") == 1, "Reception reads its patient's paginated request list");

        // Existing billing APIs prepare Paid; this suite adds no invoice endpoint, role or payment rule.
        var invoice = (await Send(HttpMethod.Post, $"patients/{profile.PatientId}/book-invoices", finance, new { amount = 20000 }))!;
        var invoiceId = Id(invoice, "bookInvoiceId");
        await Send(HttpMethod.Post, $"book-invoices/{invoiceId}/issue-book", reception, new { bookNumber = "HOANG-FIRST" }, 409);
        await Send(HttpMethod.Patch, $"book-invoices/{invoiceId}/pay", finance);
        check(await db.Notifications.AnyAsync(x => x.UserId == receptionId && x.EventKey == $"book-invoice:{invoiceId}:paid"),
            "Existing Paid notification remains available for reception");
        var book = (await Send(HttpMethod.Post, $"book-invoices/{invoiceId}/issue-book", reception, new { bookNumber = "HOANG-FIRST" }))!;
        check(Id(book, "issuedByUserId") == receptionId, "Book issuance records the authenticated issuer");
        var firstBookId = Id(book, "patientBookId");
        check(await db.PatientBooks.AnyAsync(x => x.PatientBookId == firstBookId && x.IssuedByUserId == receptionId && x.IssuedAt != default),
            "Issuer and issuance time are persisted");
        check(await db.PatientBookRequests.AsNoTracking().AnyAsync(x => x.PatientBookRequestId == requestId
            && x.BookInvoiceId == invoiceId), "Reception links its request to the Paid invoice when issuing the book");
        var issuedQueue = (await Send(HttpMethod.Get, $"patients/{profile.PatientId}/book-requests", reception))!;
        check(Id(issuedQueue, "totalItems") == 0, "Issued request leaves reception's open request list");
        foreach (var reason in new[] { "Lost", "Forgot" })
        {
            var replacement = (await Send(HttpMethod.Post, $"patients/{profile.PatientId}/book-requests", reception, new { reason }))!;
            var replacementInvoice = (await Send(HttpMethod.Post, $"patients/{profile.PatientId}/book-invoices", finance, new { amount = 20000 }))!;
            var replacementInvoiceId = Id(replacementInvoice, "bookInvoiceId");
            await Send(HttpMethod.Patch, $"book-invoices/{replacementInvoiceId}/pay", finance);
            await Send(HttpMethod.Post, $"book-invoices/{replacementInvoiceId}/issue-book", reception, new { bookNumber = "HOANG-" + reason });
            var replacementId = Id(replacement, "patientBookRequestId");
            check(await db.PatientBookRequests.AsNoTracking().AnyAsync(x => x.PatientBookRequestId == replacementId
                && x.BookInvoiceId == replacementInvoiceId), "Reception links the replacement request without changing billing");
        }
        check(await db.PatientBooks.CountAsync(x => x.PatientId == profile.PatientId && x.Status == "Issued") == 1
            && await db.PatientBooks.CountAsync(x => x.PatientId == profile.PatientId && x.PreviousBookId != null) == 2,
            "Lost/forgot requests retain history with exactly one active book");
        check(await db.Patients.CountAsync(x => x.PatientId == profile.PatientId && x.UserId == users[0].UserId) == 1,
            "Book replacement retains the original patient profile");
        check(!await db.Notifications.AnyAsync(x => x.UserId == doctorId && x.Type == "Billing"),
            "Reception request notifications do not leak to clinical recipients");
    }
}

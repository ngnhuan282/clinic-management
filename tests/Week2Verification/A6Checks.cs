using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;

internal static class A6Checks
{
    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password, Action<bool, string> check, bool expectSecure = false)
    {
        async Task<(JsonNode? Result, string? Cookie, string? SetCookie)> Send(HttpMethod method, string path,
            object? body = null, int status = 200, string? access = null, string? cookie = null, string? origin = null)
        {
            using var request = new HttpRequestMessage(method, path);
            if (body is not null) request.Content = JsonContent.Create(body);
            if (access is not null) request.Headers.Authorization = new("Bearer", access);
            if (cookie is not null) request.Headers.Add("Cookie", cookie);
            if (origin is not null) request.Headers.Add("Origin", origin);
            using var response = await client.SendAsync(request);
            check((int)response.StatusCode == status, $"A6 {method} {path}: expected {status}, got {(int)response.StatusCode}");
            var text = await response.Content.ReadAsStringAsync();
            var parsed = string.IsNullOrEmpty(text) ? null : JsonNode.Parse(text);
            var result = parsed is JsonObject envelope && envelope.ContainsKey("result") ? envelope["result"] : parsed;
            var header = response.Headers.TryGetValues("Set-Cookie", out var cookies)
                ? cookies.FirstOrDefault(x => x.StartsWith("clinic_refresh=")) : null;
            return (result, header?.Split(';')[0], header);
        }
        async Task<(string Access, string Cookie)> Login(string username)
        {
            var response = await Send(HttpMethod.Post, "api/auth/login", new { username, password });
            check(response.Result!["refreshToken"] is null && response.Result["refreshTokenExpiresAt"] is null,
                "Auth JSON excludes raw refresh credentials");
            check(response.SetCookie!.Contains("httponly", StringComparison.OrdinalIgnoreCase)
                && response.SetCookie.Contains("path=/api/auth", StringComparison.OrdinalIgnoreCase)
                && response.SetCookie.Contains("samesite=lax", StringComparison.OrdinalIgnoreCase),
                "Refresh cookie is HttpOnly, restricted to auth routes and SameSite=Lax");
            check(response.SetCookie.Contains("; secure", StringComparison.OrdinalIgnoreCase) == expectSecure,
                "Cookie Secure flag follows environment configuration");
            return (response.Result["accessToken"]!.GetValue<string>(), response.Cookie!);
        }
        var admin = await Login("testadmin");
        var headRole = await db.Roles.SingleAsync(x => x.RoleName == RoleConstants.DepartmentHead);
        var pharmacistRole = await db.Roles.SingleAsync(x => x.RoleName == RoleConstants.Pharmacist);
        var cashierRole = await db.Roles.SingleOrDefaultAsync(x => x.RoleName == RoleConstants.Cashier);
        if (cashierRole is null) { cashierRole = new Role { RoleName = RoleConstants.Cashier }; db.Roles.Add(cashierRole); await db.SaveChangesAsync(); }
        var profileRole = new Role { RoleName = "ProfileOnly" };
        db.Roles.Add(profileRole);
        await db.SaveChangesAsync();
        User NewUser(string name, int roleId) => new() { Username = name, FullName = name,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), RoleId = roleId, Status = true, CreatedAt = DateTime.UtcNow };
        var patient = NewUser("a6patient", 4);
        var other = NewUser("a6other", 4);
        var head = NewUser("a6head", headRole.RoleId);
        var cashier = NewUser("a6cashier", cashierRole.RoleId);
        var pharmacist = NewUser("a6pharmacist", pharmacistRole.RoleId);
        var profileOnly = NewUser("a6profile", profileRole.RoleId);
        db.Users.AddRange(patient, other, head, cashier, pharmacist, profileOnly);
        await db.SaveChangesAsync();
        var profile = new Patient { FullName = "A6 patient", Phone = "0901234567", UserId = patient.UserId };
        var otherProfile = new Patient { FullName = "A6 other", Phone = "0907654321", UserId = other.UserId };
        var headDoctor = new Doctor { FullName = "A6 head", DepartmentId = 1, SpecializationId = 1, UserId = head.UserId, IsActive = true };
        var foreignDoctor = new Doctor { FullName = "A6 foreign doctor", DepartmentId = 2, SpecializationId = 2, IsActive = true };
        db.Patients.AddRange(profile, otherProfile);
        db.Doctors.AddRange(headDoctor, foreignDoctor);
        await db.SaveChangesAsync();
        var patientSession = await Login(patient.Username);
        var otherSession = await Login(other.Username);
        var headSession = await Login(head.Username);
        var cashierSession = await Login(cashier.Username);
        var pharmacistSession = await Login(pharmacist.Username);

        await Send(HttpMethod.Get, "api/auth/me", status: 401);
        await Send(HttpMethod.Get, "api/auth/me", status: 401, access: "invalid-token");
        var before = (await Send(HttpMethod.Get, "api/auth/me", access: patientSession.Access)).Result!;
        check(before["userId"]!.GetValue<int>() == patient.UserId && before["passwordHash"] is null, "Own profile is resolved from JWT without credentials");
        var payload = new { fullName = " Updated account ", email = "a6@example.test", phone = "0901112222" };
        var updated = (await Send(HttpMethod.Put, "api/auth/me", payload, access: patientSession.Access)).Result!;
        check(updated["fullName"]!.GetValue<string>() == "Updated account", "Own profile trims and saves permitted fields");
        foreach (var injected in new object[] {
            new { fullName = "Hacked", userId = other.UserId }, new { fullName = "Hacked", role = "Admin" },
            new { fullName = "Hacked", roleId = 1 }, new { fullName = "Hacked", status = false } })
            await Send(HttpMethod.Put, "api/auth/me", injected, 400, patientSession.Access);
        await Send(HttpMethod.Put, $"api/auth/me/{other.UserId}", payload, 404, patientSession.Access);
        await Send(HttpMethod.Put, $"api/users/{other.UserId}", payload, 405, patientSession.Access);
        await Send(HttpMethod.Get, $"api/users/{other.UserId}", status: 403, access: patientSession.Access);
        await Send(HttpMethod.Put, "api/auth/me", new { fullName = " ", email = "bad", phone = "abc" }, 400, patientSession.Access);
        await Send(HttpMethod.Put, "api/auth/me", new { fullName = "Other", email = "a6@example.test" }, 409, otherSession.Access);
        check(await db.Users.AsNoTracking().AnyAsync(x => x.UserId == other.UserId && x.FullName == "a6other" && x.RoleId == 4 && x.Status),
            "Malicious profile requests cannot change another account, roles or lock status");
        foreach (var session in new[] { headSession, cashierSession, pharmacistSession })
        {
            await Send(HttpMethod.Get, "api/auth/me", access: session.Access);
            await Send(HttpMethod.Get, "api/test/internal", access: session.Access);
            foreach (var path in new[] { "api/users", "api/reviews/admin", "api/appointments" })
                await Send(HttpMethod.Get, path, status: 403, access: session.Access);
            await Send(HttpMethod.Post, "api/reviews", new { appointmentId = 1, rating = 5 }, 403, session.Access);
        }
        foreach (var path in new[] { "api/users", "api/reviews/admin", "api/reviews/my-appointments", "api/schedule-requests", "api/doctor-schedules/department/options", "api/invoices/pending", "api/dispensing" })
            await Send(HttpMethod.Get, path, status: 401);
        await Send(HttpMethod.Get, "api/invoices/pending", status: 403, access: headSession.Access);
        await Send(HttpMethod.Get, "api/invoices/pending", status: 403, access: pharmacistSession.Access);
        await Send(HttpMethod.Get, "api/invoices/pending", access: cashierSession.Access);
        await Send(HttpMethod.Get, "api/dispensing", status: 403, access: cashierSession.Access);
        await Send(HttpMethod.Get, "api/dispensing", status: 403, access: headSession.Access);
        await Send(HttpMethod.Get, "api/dispensing", access: pharmacistSession.Access);

        var date = DateTime.Today.AddDays(80);
        Appointment NewAppointment(string status, int hour, bool own = true) => new() {
            DoctorId = 1, PatientId = own ? patient.UserId : other.UserId,
            PatientProfileId = own ? profile.PatientId : otherProfile.PatientId, PatientName = "A6 patient", PatientPhone = "0901234567",
            AppointmentDate = date, StartTime = TimeSpan.FromHours(hour), EndTime = TimeSpan.FromHours(hour + 0.5), Status = status, Reason = "A6 verification" };
        var pending = NewAppointment("Pending", 8);
        var completed = NewAppointment("Completed", 9);
        var foreignAppointment = NewAppointment("Completed", 10, false);
        var concurrentAppointment = NewAppointment("Completed", 11);
        var uiAppointment = NewAppointment("Completed", 12);
        db.Appointments.AddRange(pending, completed, foreignAppointment, concurrentAppointment, uiAppointment);
        await db.SaveChangesAsync();
        await Send(HttpMethod.Post, "api/reviews", new { appointmentId = pending.AppointmentId, rating = 5 }, 400, patientSession.Access);
        await Send(HttpMethod.Post, "api/reviews", new { appointmentId = foreignAppointment.AppointmentId, rating = 5 }, 403, patientSession.Access);
        await Send(HttpMethod.Post, "api/reviews", new { appointmentId = completed.AppointmentId, rating = 5, doctorId = foreignDoctor.DoctorId, patientId = other.UserId }, 400, patientSession.Access);
        foreach (var rating in new[] { 0, 6 })
            await Send(HttpMethod.Post, "api/reviews", new { appointmentId = completed.AppointmentId, rating }, 400, patientSession.Access);
        await Send(HttpMethod.Post, "api/reviews", new { appointmentId = completed.AppointmentId, rating = 5, comment = new string('a', 501) }, 400, patientSession.Access);
        var review = (await Send(HttpMethod.Post, "api/reviews", new { appointmentId = completed.AppointmentId, rating = 4, comment = "A6 review" }, access: patientSession.Access)).Result!;
        var reviewId = review["reviewId"]!.GetValue<int>();
        check(review["doctorId"]!.GetValue<int>() == 1 && review["patientId"]!.GetValue<int>() == profile.PatientId, "Review patient and doctor come from the owned appointment");
        await Send(HttpMethod.Post, "api/reviews", new { appointmentId = completed.AppointmentId, rating = 5 }, 409, patientSession.Access);
        var mine = (await Send(HttpMethod.Get, "api/reviews/my-appointments", access: patientSession.Access)).Result!;
        check(mine["totalItems"]!.GetValue<int>() == 3 && !mine["items"]!.AsArray().Any(x => x!["appointmentId"]!.GetValue<int>() == foreignAppointment.AppointmentId), "Patient review list contains only own completed appointments");
        await Send(HttpMethod.Patch, $"api/reviews/{reviewId}/visibility", new { isVisible = false }, 403, patientSession.Access);
        await Send(HttpMethod.Patch, $"api/reviews/{reviewId}/visibility", new { }, 400, admin.Access);
        await Send(HttpMethod.Patch, $"api/reviews/{reviewId}/visibility", new { isVisible = false }, access: admin.Access);
        var publicRows = (await Send(HttpMethod.Get, "api/reviews?doctorId=1")).Result!;
        check(publicRows["totalItems"]!.GetValue<int>() == 0 && await db.Reviews.AsNoTracking().AnyAsync(x => x.ReviewId == reviewId && !x.IsVisible), "Hidden review is retained in DB and absent from public list/count");
        var adminRows = (await Send(HttpMethod.Get, "api/reviews/admin", access: admin.Access)).Result!;
        check(adminRows["totalItems"]!.GetValue<int>() == 1, "Admin still sees hidden review");
        await Send(HttpMethod.Patch, $"api/reviews/{reviewId}/visibility", new { isVisible = true }, access: admin.Access);
        publicRows = (await Send(HttpMethod.Get, "api/reviews?doctorId=1")).Result!;
        check(publicRows["totalItems"]!.GetValue<int>() == 1 && publicRows["items"]![0]!["patientId"] is null
            && publicRows["items"]![0]!["appointmentId"] is null, "Public reviews show visible feedback without patient or appointment IDs");
        async Task<int> CreateConcurrently() {
            using var request = new HttpRequestMessage(HttpMethod.Post, "api/reviews") { Content = JsonContent.Create(new { appointmentId = concurrentAppointment.AppointmentId, rating = 5 }) };
            request.Headers.Authorization = new("Bearer", patientSession.Access);
            using var response = await client.SendAsync(request);
            return (int)response.StatusCode;
        }
        var createStatuses = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => CreateConcurrently()));
        check(createStatuses.Count(x => x == 200) == 1 && createStatuses.Count(x => x == 409) == 3,
            "Database unique constraint permits one review under concurrent submission");

        var fresh = await Login(patient.Username);
        var tokenHash = Hash(fresh.Cookie);
        check(await db.RefreshTokens.AsNoTracking().AnyAsync(x => x.TokenHash == tokenHash && x.TokenHash.Length == 64 && x.ExpiresAt > DateTime.UtcNow), "DB stores only a hash and expiry of the random cookie token");
        await Send(HttpMethod.Post, "api/auth/refresh", new { refreshToken = fresh.Cookie.Split('=', 2)[1] }, 401);
        await Send(HttpMethod.Post, "api/auth/refresh", status: 401, cookie: "clinic_refresh=invalid");
        await Send(HttpMethod.Post, "api/auth/refresh", status: 403, cookie: fresh.Cookie, origin: "https://untrusted.example");
        var rotated = await Send(HttpMethod.Post, "api/auth/refresh", cookie: fresh.Cookie);
        check(rotated.Cookie != fresh.Cookie && rotated.Result!["refreshToken"] is null
            && await db.RefreshTokens.AsNoTracking().AnyAsync(x => x.TokenHash == tokenHash && x.RevokedAt != null), "Successful refresh rotates cookie and revokes old token atomically");
        await Send(HttpMethod.Post, "api/auth/refresh", status: 401, cookie: fresh.Cookie);
        var loggedOut = await Send(HttpMethod.Post, "api/auth/logout", status: 204, cookie: rotated.Cookie);
        check(loggedOut.SetCookie!.StartsWith("clinic_refresh=;") && await db.RefreshTokens.AsNoTracking().AnyAsync(x => x.TokenHash == Hash(rotated.Cookie!) && x.RevokedAt != null), "Logout deletes cookie and revokes server refresh credential");
        await Send(HttpMethod.Post, "api/auth/refresh", status: 401, cookie: rotated.Cookie);
        await Send(HttpMethod.Post, "api/auth/logout", status: 204, cookie: rotated.Cookie);
        var expired = await Login(patient.Username);
        await db.RefreshTokens.Where(x => x.TokenHash == Hash(expired.Cookie)).ExecuteUpdateAsync(s => s.SetProperty(x => x.ExpiresAt, DateTime.UtcNow.AddDays(-1)));
        await Send(HttpMethod.Post, "api/auth/refresh", status: 401, cookie: expired.Cookie);
        var inactive = await Login(other.Username);
        await db.Users.Where(x => x.UserId == other.UserId).ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, false));
        await Send(HttpMethod.Post, "api/auth/refresh", status: 401, cookie: inactive.Cookie);
        await Send(HttpMethod.Get, "api/auth/me", status: 401, access: inactive.Access);
        await db.Users.Where(x => x.UserId == other.UserId).ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, true));
        var concurrent = await Login(patient.Username);
        async Task<int> RefreshConcurrently() {
            using var request = new HttpRequestMessage(HttpMethod.Post, "api/auth/refresh"); request.Headers.Add("Cookie", concurrent.Cookie);
            using var response = await client.SendAsync(request); return (int)response.StatusCode;
        }
        var refreshStatuses = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => RefreshConcurrently()));
        check(refreshStatuses.Count(x => x == 200) == 1 && refreshStatuses.Count(x => x == 401) == 3, "Concurrent refresh consumes a cookie token exactly once");

        var workDate = DateOnly.FromDateTime(date.AddDays(1));
        var ownRequest = new DoctorScheduleRequest { DoctorId = 1, RoomId = 1, WorkDate = workDate, StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(9) };
        var foreignRequest = new DoctorScheduleRequest { DoctorId = foreignDoctor.DoctorId, RoomId = 2, WorkDate = workDate, StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(9) };
        var foreignRoomRequest = new DoctorScheduleRequest { DoctorId = 1, RoomId = 2, WorkDate = workDate, StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(9) };
        var conflictLeak = new DoctorScheduleRequest { DoctorId = foreignDoctor.DoctorId, RoomId = 1, WorkDate = workDate, StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(9) };
        var selfRequest = new DoctorScheduleRequest { DoctorId = headDoctor.DoctorId, RoomId = 1, WorkDate = workDate, StartTime = TimeSpan.FromHours(10), EndTime = TimeSpan.FromHours(11) };
        db.DoctorScheduleRequests.AddRange(ownRequest, foreignRequest, foreignRoomRequest, conflictLeak, selfRequest);
        var ownSchedule = new DoctorSchedule { DoctorId = 1, RoomId = 1, WorkDate = workDate, StartTime = TimeSpan.FromHours(13), EndTime = TimeSpan.FromHours(14), Status = "Approved", MaxPatients = 2 };
        var foreignSchedule = new DoctorSchedule { DoctorId = foreignDoctor.DoctorId, RoomId = 2, WorkDate = workDate, StartTime = TimeSpan.FromHours(13), EndTime = TimeSpan.FromHours(14), Status = "Approved", MaxPatients = 2 };
        var mismatchedSchedule = new DoctorSchedule { DoctorId = 1, RoomId = 2, WorkDate = workDate, StartTime = TimeSpan.FromHours(15), EndTime = TimeSpan.FromHours(16), Status = "Approved", MaxPatients = 2 };
        db.DoctorSchedules.AddRange(ownSchedule, foreignSchedule, mismatchedSchedule);
        await db.SaveChangesAsync();
        foreach (var session in new[] { cashierSession, pharmacistSession })
            foreach (var path in new[] { "api/schedule-requests", "api/doctor-schedules/department/options" })
                await Send(HttpMethod.Get, path, status: 403, access: session.Access);
        var requests = (await Send(HttpMethod.Get, "api/schedule-requests", access: headSession.Access)).Result!;
        check(requests["totalItems"]!.GetValue<int>() == 2 && requests["items"]!.AsArray().All(x => x!["roomId"]!.GetValue<int>() == 1), "Head request list/count excludes foreign doctors and foreign rooms");
        var detail = (await Send(HttpMethod.Get, $"api/schedule-requests/{ownRequest.RequestId}", access: headSession.Access)).Result!;
        check(detail["conflicts"]!.AsArray().Count == 0, "Conflict detail excludes cross-department request information");
        foreach (var id in new[] { foreignRequest.RequestId, foreignRoomRequest.RequestId, conflictLeak.RequestId }) {
            await Send(HttpMethod.Get, $"api/schedule-requests/{id}", status: 403, access: headSession.Access);
            await Send(HttpMethod.Post, $"api/schedule-requests/{id}/approve", status: 403, access: headSession.Access);
            await Send(HttpMethod.Post, $"api/schedule-requests/{id}/reject", new { rejectReason = "A6" }, 403, headSession.Access);
        }
        await Send(HttpMethod.Post, $"api/schedule-requests/{selfRequest.RequestId}/approve", status: 403, access: headSession.Access);
        await Send(HttpMethod.Post, $"api/schedule-requests/{selfRequest.RequestId}/reject", new { rejectReason = "A6" }, 403, headSession.Access);
        foreach (var filter in new[] { $"doctorId={foreignDoctor.DoctorId}", "roomId=2" })
            foreach (var path in new[] { "api/schedule-requests", "api/doctor-schedules", $"api/doctor-schedules/department?date={workDate}&" })
                await Send(HttpMethod.Get, path + (path.Contains('?') ? "" : "?") + filter, status: 403, access: headSession.Access);
        var schedules = (await Send(HttpMethod.Get, $"api/doctor-schedules?date={workDate}&departmentId=2", access: headSession.Access)).Result!.AsArray();
        check(schedules.Count == 1 && schedules[0]!["roomId"]!.GetValue<int>() == 1, "Legacy schedule list also scopes doctor and room from server department");
        await Send(HttpMethod.Get, $"api/doctor-schedules/{ownSchedule.ScheduleId}", access: headSession.Access);
        foreach (var id in new[] { foreignSchedule.ScheduleId, mismatchedSchedule.ScheduleId })
            await Send(HttpMethod.Get, $"api/doctor-schedules/{id}", status: 404, access: headSession.Access);
        await Send(HttpMethod.Get, $"api/doctor-schedules/available-slots?doctorId={foreignDoctor.DoctorId}&date={workDate}", status: 403, access: headSession.Access);
        await Send(HttpMethod.Get, $"api/appointments/available-slots?doctorId={foreignDoctor.DoctorId}&date={workDate}", status: 403, access: headSession.Access);
        var rooms = (await Send(HttpMethod.Get, "api/doctor-schedules/rooms", access: headSession.Access)).Result!.AsArray();
        check(rooms.All(x => x!["departmentId"]!.GetValue<int>() == 1), "Registration room choices are limited to server department");
        await Send(HttpMethod.Post, "api/doctor-schedules/request", new { workDate, roomId = 2, startTime = "18:00", endTime = "19:00" }, 403, headSession.Access);
        await Send(HttpMethod.Post, $"api/schedule-requests/{selfRequest.RequestId}/approve", access: admin.Access);
        check(await db.DoctorScheduleRequests.AsNoTracking().AnyAsync(x => x.RequestId == selfRequest.RequestId && x.Status == "Approved" && x.ReviewerId == admin.ResultUserId()), "Admin approves head request without self-approval");
    }

    private static string Hash(string cookie) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Uri.UnescapeDataString(cookie.Split('=', 2)[1]))));

    private static int ResultUserId(this (string Access, string Cookie) session)
    {
        var payload = session.Access.Split('.')[1].Replace('-', '+').Replace('_', '/');
        payload = payload.PadRight((payload.Length + 3) / 4 * 4, '=');
        return int.Parse(JsonNode.Parse(Convert.FromBase64String(payload))!["userId"]!.GetValue<string>());
    }
}

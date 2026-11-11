using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Helpers;
using Microsoft.EntityFrameworkCore;

internal record AdminCompletionMetadata(int StaffUserId, string StaffUsername, int AvailableDoctorId);

internal static class AdminCompletionChecks
{
    public static async Task<AdminCompletionMetadata> RunAsync(HttpClient http, ApplicationDbContext db,
        string password, int adminUserId, string adminToken, int patientUserId, string patientToken,
        int patientProfileId, Action<bool, string> check)
    {
        async Task<JsonNode?> Api(HttpMethod method, string path, object? payload = null, string? access = null, int expected = 200)
        {
            using var request = new HttpRequestMessage(method, "api/" + path);
            if (access != null) request.Headers.Authorization = new("Bearer", access);
            if (payload != null) request.Content = JsonContent.Create(payload);
            using var response = await http.SendAsync(request);
            if ((int)response.StatusCode != expected)
                throw new InvalidOperationException($"Admin check {method} {path}: expected {expected}, got {(int)response.StatusCode}.");
            return expected is 200 or 201 ? JsonNode.Parse(await response.Content.ReadAsStringAsync())?["result"] : null;
        }
        var roleIds = await db.Roles.ToDictionaryAsync(x => x.RoleName, x => x.RoleId);
        object Staff(string username, int roleId, int? doctorId = null, string? email = null) => new
        {
            username, password, fullName = "Nhân viên kiểm thử " + username,
            email = email ?? username + "@admin-check.example.test", phone = "0902000001", roleId, doctorId
        };
        var receptionId = roleIds[RoleConstants.Receptionist];
        foreach (var path in new[] { "users/summary", "users/available-doctor-profiles", "reviews/admin/statistics" })
        {
            await Api(HttpMethod.Get, path, expected: 401);
            await Api(HttpMethod.Get, path, access: patientToken, expected: 403);
        }
        await Api(HttpMethod.Post, "users", Staff("unauth_staff", receptionId), expected: 401);
        await Api(HttpMethod.Post, "users", Staff("forbidden_staff", receptionId), patientToken, 403);
        check(true, "Admin account and rating APIs enforce anonymous 401 and non-Admin 403");
        var created = (await Api(HttpMethod.Post, "users", Staff("ui_created_staff", receptionId), adminToken, 201))!;
        var createdId = created["userId"]!.GetValue<int>();
        check(created["role"]!.GetValue<string>() == RoleConstants.Receptionist
            && created["accessToken"] == null && created["passwordHash"] == null,
            "Staff creation persists the selected role without returning tokens or password hashes");
        check((await db.Users.AsNoTracking().SingleAsync(x => x.UserId == createdId)).PasswordHash != password,
            "Staff passwords are hashed at rest");
        await Api(HttpMethod.Post, "users", Staff("ui_created_staff", receptionId), adminToken, 400);
        await Api(HttpMethod.Post, "users", Staff("ui_duplicate_email", receptionId, email: "ui_created_staff@admin-check.example.test"), adminToken, 409);
        await Api(HttpMethod.Post, "users", Staff("ui_patient_not_staff", roleIds[RoleConstants.Patient]), adminToken, 400);
        await Api(HttpMethod.Post, "users", new { username = "bad_password_staff", password = string.Concat(Enumerable.Repeat("😀", 19)), fullName = "Không hợp lệ", roleId = receptionId }, adminToken, 400);
        check(true, "Staff creation rejects duplicate username/email, Patient role and oversized UTF-8 passwords");
        var accountBefore = await db.Users.AsNoTracking().SingleAsync(x => x.UserId == createdId);
        await Api(HttpMethod.Put, $"users/{createdId}", new { fullName = "Nhân viên đã cập nhật", email = "updated.staff@example.test", phone = "0902000999" }, adminToken);
        var accountAfter = await db.Users.AsNoTracking().SingleAsync(x => x.UserId == createdId);
        check(accountAfter.FullName == "Nhân viên đã cập nhật" && accountAfter.Email == "updated.staff@example.test"
            && accountAfter.Phone == "0902000999" && accountAfter.RoleId == accountBefore.RoleId
            && accountAfter.PasswordHash == accountBefore.PasswordHash && accountAfter.SecurityVersion == accountBefore.SecurityVersion,
            "Editing contact details persists without changing roles, passwords or sessions");
        await Api(HttpMethod.Put, $"users/{createdId}", new { fullName = "Tamper", roleId = roleIds[RoleConstants.Admin] }, adminToken, 400);
        await Api(HttpMethod.Put, $"users/{createdId}", new { fullName = "Tamper", status = false }, adminToken, 400);
        await Api(HttpMethod.Put, $"users/{createdId}", new { fullName = "", email = "bad" }, adminToken, 400);
        await Api(HttpMethod.Put, $"users/{createdId}", new { fullName = "Forbidden" }, patientToken, 403);
        await Api(HttpMethod.Put, "users/2147483647", new { fullName = "Missing" }, adminToken, 404);
        check(true, "Profile updates reject access-field injection, invalid data, missing targets and unauthorized callers");

        var profiles = Enumerable.Range(1, 5).Select(index => new Doctor
        {
            FullName = "Hồ sơ bác sĩ kiểm thử Admin " + index, DepartmentId = 1, SpecializationId = 1,
            Title = "BS", ExperienceYears = 8, IsActive = true
        }).ToArray();
        var inactive = new Doctor { FullName = "Hồ sơ ngừng hoạt động", DepartmentId = 1, SpecializationId = 1, Title = "BS", IsActive = false };
        db.Doctors.AddRange(profiles); db.Doctors.Add(inactive); await db.SaveChangesAsync();
        var available = (await Api(HttpMethod.Get, "users/available-doctor-profiles?pageSize=100", access: adminToken))!;
        check(available["items"]!.AsArray().All(x => x!["doctorId"]!.GetValue<int>() != inactive.DoctorId), "Only active unlinked doctor profiles are available");
        var page1 = (await Api(HttpMethod.Get, "users/available-doctor-profiles?pageSize=1&pageNumber=1", access: adminToken))!;
        var page2 = (await Api(HttpMethod.Get, "users/available-doctor-profiles?pageSize=1&pageNumber=2", access: adminToken))!;
        check(page1["items"]![0]!["doctorId"]!.GetValue<int>() != page2["items"]![0]!["doctorId"]!.GetValue<int>(), "Doctor profile picker uses stable pagination");
        await Api(HttpMethod.Post, "users", Staff("ui_doctor_no_profile", roleIds[RoleConstants.Doctor]), adminToken, 400);
        await Api(HttpMethod.Post, "users", Staff("ui_doctor_inactive", roleIds[RoleConstants.Doctor], inactive.DoctorId), adminToken, 404);
        var doctor = (await Api(HttpMethod.Post, "users", Staff("ui_created_doctor", roleIds[RoleConstants.Doctor], profiles[0].DoctorId), adminToken, 201))!;
        await Api(HttpMethod.Post, "users", Staff("ui_link_conflict", roleIds[RoleConstants.Doctor], profiles[0].DoctorId), adminToken, 409);
        var head = (await Api(HttpMethod.Post, "users", Staff("ui_created_head", roleIds[RoleConstants.DepartmentHead], profiles[1].DoctorId), adminToken, 201))!;
        db.ChangeTracker.Clear();
        var doctorUserId = doctor["userId"]!.GetValue<int>();
        var headUserId = head["userId"]!.GetValue<int>();
        check(await db.Doctors.AnyAsync(x => x.DoctorId == profiles[0].DoctorId && x.UserId == doctorUserId)
            && await db.Doctors.AnyAsync(x => x.DoctorId == profiles[1].DoctorId && x.UserId == headUserId),
            "Doctor and DepartmentHead accounts atomically link their selected profiles");
        check(!await db.Users.AnyAsync(x => x.Username == "ui_link_conflict" || x.Username == "ui_doctor_inactive" || x.Username == "ui_doctor_no_profile"),
            "Failed doctor-account creation leaves no partial users");
        async Task<int> Race(string username)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "api/users") { Content = JsonContent.Create(Staff(username, roleIds[RoleConstants.Doctor], profiles[2].DoctorId)) };
            request.Headers.Authorization = new("Bearer", adminToken);
            using var response = await http.SendAsync(request);
            return (int)response.StatusCode;
        }
        var race = await Task.WhenAll(Race("ui_doctor_race_a"), Race("ui_doctor_race_b"));
        check(race.Count(x => x == 201) == 1 && race.Count(x => x == 409) == 1
            && await db.Users.CountAsync(x => x.Username == "ui_doctor_race_a" || x.Username == "ui_doctor_race_b") == 1,
            "Concurrent linking creates exactly one account for one doctor");

        var summary = (await Api(HttpMethod.Get, "users/summary", access: adminToken))!;
        var count = await db.Users.CountAsync();
        var active = await db.Users.CountAsync(x => x.Status);
        check(summary["total"]!.GetValue<int>() == count && summary["active"]!.GetValue<int>() == active
            && summary["locked"]!.GetValue<int>() == count - active, "Account summary counts all database rows beyond the current page");
        var filtered = (await Api(HttpMethod.Get, "users?search=0902000999&pageSize=1", access: adminToken))!;
        var filteredSummary = (await Api(HttpMethod.Get, "users/summary?search=0902000999", access: adminToken))!;
        check(filtered["items"]![0]!["userId"]!.GetValue<int>() == createdId && filteredSummary["total"]!.GetValue<int>() == 1,
            "Account list and summary use consistent phone/search filters");
        var doctorRows = (await Api(HttpMethod.Get, "users?search=ui_created_doctor", access: adminToken))!;
        check(doctorRows["items"]![0]!["doctorId"]!.GetValue<int>() == profiles[0].DoctorId
            && doctorRows["items"]![0]!["departmentName"]!.GetValue<string>().Length > 0, "Account list exposes actual doctor/department links");
        using (var cookieClient = new HttpClient(new HttpClientHandler { UseCookies = true, CookieContainer = new CookieContainer() }) { BaseAddress = http.BaseAddress })
        {
            using var login = await cookieClient.PostAsJsonAsync("api/auth/login", new { username = "uiadmin", password });
            var cookieAdmin = JsonNode.Parse(await login.Content.ReadAsStringAsync())!["result"]!;
            using var request = new HttpRequestMessage(HttpMethod.Post, "api/users") { Content = JsonContent.Create(Staff("ui_cookie_staff", receptionId)) };
            request.Headers.Authorization = new("Bearer", cookieAdmin["accessToken"]!.GetValue<string>());
            using var response = await cookieClient.SendAsync(request);
            check(response.StatusCode == HttpStatusCode.Created && !response.Headers.Contains("Set-Cookie"), "Staff creation does not overwrite the Admin refresh cookie");
            using var refresh = await cookieClient.PostAsJsonAsync("api/auth/refresh", new { });
            var refreshed = JsonNode.Parse(await refresh.Content.ReadAsStringAsync())?["result"];
            check(refresh.StatusCode == HttpStatusCode.OK && refreshed?["userId"]?.GetValue<int>() == adminUserId, "Admin can refresh the same session after creating staff");
        }
        foreach (var permission in new[] { PermissionCodes.AccountsCreate, PermissionCodes.AccountsAssignRole })
        {
            var roleId = roleIds[RoleConstants.Admin];
            var grant = await db.RolePermissions.SingleAsync(x => x.RoleId == roleId && x.PermissionCode == permission);
            db.RolePermissions.Remove(grant); await db.SaveChangesAsync();
            try { await Api(HttpMethod.Post, "users", Staff("ui_missing_permission", receptionId), adminToken, 403); }
            finally { db.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionCode = permission }); await db.SaveChangesAsync(); }
        }
        check(!await db.Users.AnyAsync(x => x.Username == "ui_missing_permission"), "Creation requires both create-account and assign-role permissions");
        check(await db.RbacAudits.AnyAsync(x => x.EntityId == createdId && x.Action == "user.create")
            && await db.RbacAudits.AnyAsync(x => x.EntityId == createdId && x.Action == "user.profile"), "Creation and profile edits persist audit records");

        var historical = Enumerable.Range(0, 12).Select(index => new Appointment
        {
            DoctorId = 1, PatientId = patientUserId, PatientProfileId = patientProfileId,
            PatientName = "Bệnh nhân kiểm thử", PatientPhone = "0903000001",
            AppointmentDate = ClinicClock.Today.AddDays(-100 - index).ToDateTime(TimeOnly.MinValue),
            StartTime = TimeSpan.FromHours(9.5), EndTime = TimeSpan.FromHours(10),
            Reason = "Lượt khám hoàn thành trong fixture", Status = AppointmentStatusConstants.Completed, CreatedAt = DateTime.UtcNow
        }).ToArray();
        db.Appointments.AddRange(historical); await db.SaveChangesAsync();
        foreach (var (appointment, index) in historical.Select((value, index) => (value, index)))
            await Api(HttpMethod.Post, "reviews", new { appointmentId = appointment.AppointmentId, rating = index % 5 + 1, comment = "Đánh giá kiểm thử " + index }, patientToken);
        var reference = await db.Reviews.AsNoTracking().ToListAsync();
        var statistics = (await Api(HttpMethod.Get, "reviews/admin/statistics?pageSize=1", access: adminToken))!;
        var totals = statistics["totals"]!;
        static bool Near(JsonNode? actual, double expected) => actual != null && Math.Abs(actual.GetValue<double>() - expected) < 0.000001;
        check(totals["totalReviews"]!.GetValue<int>() == reference.Count
            && Near(totals["averageRating"], reference.Average(x => (double)x.Rating))
            && Near(totals["publicAverageRating"], reference.Where(x => x.IsVisible).Average(x => (double)x.Rating)), "Rating totals and averages include every review beyond the first page");
        check(statistics["doctors"]!["items"]!.AsArray().Count == 1
            && statistics["doctors"]!["totalItems"]!.GetValue<int>() == reference.Select(x => x.DoctorId).Distinct().Count(), "Doctor rating summaries paginate independently");
        var empty = (await Api(HttpMethod.Get, "reviews/admin/statistics?doctorId=2147483647", access: adminToken))!;
        check(empty["totals"]!["totalReviews"]!.GetValue<int>() == 0 && empty["totals"]!["averageRating"] == null, "No-review results do not invent zero-star averages");
        var visible = reference.First(x => x.IsVisible);
        await Api(HttpMethod.Patch, $"reviews/{visible.ReviewId}/visibility", new { isVisible = false }, adminToken);
        var moderated = (await Api(HttpMethod.Get, $"reviews/admin/statistics?doctorId={visible.DoctorId}", access: adminToken))!;
        var group = reference.Where(x => x.DoctorId == visible.DoctorId).ToList();
        var remaining = group.Where(x => x.IsVisible && x.ReviewId != visible.ReviewId).ToList();
        check(moderated["totals"]!["hiddenReviews"]!.GetValue<int>() == group.Count(x => !x.IsVisible) + 1
            && Near(moderated["totals"]!["averageRating"], group.Average(x => (double)x.Rating))
            && (remaining.Count == 0 ? moderated["totals"]!["publicAverageRating"] == null : Near(moderated["totals"]!["publicAverageRating"], remaining.Average(x => (double)x.Rating))), "Moderation updates public averages while preserving overall averages");
        await Api(HttpMethod.Patch, $"reviews/{visible.ReviewId}/visibility", new { isVisible = true }, adminToken);
        return new(createdId, "ui_created_staff", profiles[3].DoctorId);
    }
}

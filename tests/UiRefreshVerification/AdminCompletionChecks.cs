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
            if (expected is not (200 or 201)) return null;
            var parsed = JsonNode.Parse(await response.Content.ReadAsStringAsync());
            return parsed is JsonObject envelope && envelope.ContainsKey("result") && envelope.ContainsKey("code") ? envelope["result"] : parsed;
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

        // Public department & specialization catalog (I.1)
        var inactiveDepartment = new Department { Code = "UI-INACTIVE-DEPT", Name = "Khoa ngừng hoạt động kiểm thử", IsActive = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        db.Departments.Add(inactiveDepartment);
        await db.SaveChangesAsync();
        var activeExtraSpec = new Specialization { Code = "UI-TIM-MACH", Name = "Nội tim mạch kiểm thử", Description = "Chuyên khoa tim mạch trực thuộc Nội tổng quát.", DepartmentId = 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var inactiveSpec = new Specialization { Code = "UI-SPEC-OFF", Name = "Chuyên khoa ngừng hoạt động", DepartmentId = 1, IsActive = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var specInInactiveDept = new Specialization { Code = "UI-DEPT-OFF-SPEC", Name = "Chuyên khoa thuộc khoa khóa", DepartmentId = inactiveDepartment.DepartmentId, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        db.Specializations.AddRange(activeExtraSpec, inactiveSpec, specInInactiveDept);
        await db.SaveChangesAsync();

        var publicSpecs = (await Api(HttpMethod.Get, "specializations/public"))!.AsArray();
        var dept1Specs = (await Api(HttpMethod.Get, "specializations/public?departmentId=1"))!.AsArray();
        var publicDepts = (await Api(HttpMethod.Get, "departments/public"))!.AsArray();
        var bookingDepts = (await Api(HttpMethod.Get, "appointments/departments"))!.AsArray();
        check(publicSpecs.Any(x => x!["specializationId"]!.GetValue<int>() == activeExtraSpec.SpecializationId
                && x["departmentId"]!.GetValue<int>() == 1
                && x["departmentName"]!.GetValue<string>() == "Nội tổng quát")
            && publicSpecs.All(x => x!["specializationId"]!.GetValue<int>() != inactiveSpec.SpecializationId
                && x["specializationId"]!.GetValue<int>() != specInInactiveDept.SpecializationId)
            && dept1Specs.All(x => x!["departmentId"]!.GetValue<int>() == 1),
            "Public specialization catalog works anonymously, links departments, and excludes inactive items");
        check(publicDepts.All(x => x!["departmentId"]!.GetValue<int>() != inactiveDepartment.DepartmentId)
            && bookingDepts.Single(x => x!["departmentId"]!.GetValue<int>() == 1)!["specializations"]!.AsArray()
                .Any(x => x!["specializationId"]!.GetValue<int>() == activeExtraSpec.SpecializationId),
            "Public department endpoints include active child specializations and exclude inactive departments");

        // Clinic configuration (III.9)
        await Api(HttpMethod.Get, "clinic-settings", expected: 401);
        await Api(HttpMethod.Get, "clinic-settings", access: patientToken, expected: 403);
        await Api(HttpMethod.Put, "clinic-settings", new { clinicName = "Forbidden" }, expected: 401);
        await Api(HttpMethod.Put, "clinic-settings", new { clinicName = "Forbidden" }, patientToken, 403);
        check(true, "Clinic settings admin APIs enforce anonymous 401 and non-Admin 403");

        var initialPublicSettings = (await Api(HttpMethod.Get, "public/clinic-settings"))!;
        var initialAdminSettings = (await Api(HttpMethod.Get, "clinic-settings", access: adminToken))!;
        check(initialPublicSettings["defaultExaminationFee"]!.GetValue<decimal>() == 150000m
            && initialPublicSettings["patientBookFee"]!.GetValue<decimal>() == 10000m
            && initialPublicSettings["updatedByUserId"] == null
            && initialAdminSettings["clinicSettingId"]!.GetValue<int>() == 1,
            "Seeded clinic settings are readable both publicly and in Admin management");

        object SettingsPayload(decimal examFee = 185000m, decimal bookFee = 15000m, int slotMinutes = 30, int lowStock = 15, int nearExpiry = 45) => new
        {
            clinicName = "Phòng khám Đa khoa MediFlow Sài Gòn",
            tagline = "Chăm sóc chuẩn mực - Minh bạch chi phí",
            description = "Hệ thống khám chữa bệnh đa chuyên khoa ứng dụng hồ sơ và lịch hẹn trực tuyến.",
            phone = "1900 6886",
            email = "cskh@mediflow-clinic.vn",
            workingHours = "07:00 – 20:30, Thứ Hai – Chủ Nhật",
            primaryLocationName = "Cơ sở Quận 1",
            primaryLocationAddress = "128 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh",
            secondaryLocationName = "Cơ sở Thủ Đức",
            secondaryLocationAddress = "88 Võ Văn Ngân, TP. Thủ Đức, TP. Hồ Chí Minh",
            defaultExaminationFee = examFee,
            patientBookFee = bookFee,
            defaultSlotDurationMinutes = slotMinutes,
            defaultMaxPatientsPerSlot = 2,
            lowStockThreshold = lowStock,
            nearExpiryDays = nearExpiry
        };

        await Api(HttpMethod.Put, "clinic-settings", new { clinicName = "", defaultExaminationFee = 0, patientBookFee = -1000, defaultSlotDurationMinutes = 25 }, adminToken, 400);
        await Api(HttpMethod.Put, "clinic-settings", new
        {
            clinicName = "Tamper", tagline = "Tamper", description = "Tamper", phone = "1900 6886",
            email = "cskh@mediflow-clinic.vn", workingHours = "08:00 - 17:00",
            primaryLocationName = "Cơ sở 1", primaryLocationAddress = "Địa chỉ 1",
            secondaryLocationName = "Chỉ có tên cơ sở phụ", secondaryLocationAddress = "",
            defaultExaminationFee = 150000m, patientBookFee = 10000m, defaultSlotDurationMinutes = 30,
            defaultMaxPatientsPerSlot = 1, lowStockThreshold = 10, nearExpiryDays = 30
        }, adminToken, 400);
        await Api(HttpMethod.Put, "clinic-settings", new
        {
            clinicName = "Tamper", tagline = "Tamper", description = "Tamper", phone = "1900 6886",
            email = "cskh@mediflow-clinic.vn", workingHours = "08:00 - 17:00",
            primaryLocationName = "Cơ sở 1", primaryLocationAddress = "Địa chỉ 1",
            defaultExaminationFee = 150000m, patientBookFee = 10000m, defaultSlotDurationMinutes = 30,
            defaultMaxPatientsPerSlot = 1, lowStockThreshold = 10, nearExpiryDays = 30,
            updatedByUserId = 999
        }, adminToken, 400);
        check(true, "Clinic settings validation rejects invalid fees/slots, partial secondary location and injected audit fields");

        var updatedSettings = (await Api(HttpMethod.Put, "clinic-settings", SettingsPayload(), adminToken))!;
        var refreshedPublicSettings = (await Api(HttpMethod.Get, "public/clinic-settings"))!;
        check(updatedSettings["updatedByUserId"]!.GetValue<int>() == adminUserId
            && refreshedPublicSettings["clinicName"]!.GetValue<string>() == "Phòng khám Đa khoa MediFlow Sài Gòn"
            && refreshedPublicSettings["defaultExaminationFee"]!.GetValue<decimal>() == 185000m
            && refreshedPublicSettings["patientBookFee"]!.GetValue<decimal>() == 15000m
            && refreshedPublicSettings["locations"]!.AsArray().Count == 2,
            "Saved clinic settings update public clinic information, locations and listed fees");

        var pendingBillings = (await Api(HttpMethod.Get, "invoices/pending?stage=Pending", access: adminToken))!.AsArray();
        check(pendingBillings.Count > 0 && pendingBillings.All(x =>
                x!["items"]![0]!["unitPrice"]!.GetValue<decimal>() == 185000m
                && x["items"]![0]!["totalPrice"]!.GetValue<decimal>() == 185000m),
            "Pending consultation billing uses configured DefaultExaminationFee instead of a hardcoded constant");

        var configuredBookInvoice = (await Api(HttpMethod.Post, $"patients/{patientProfileId}/book-invoices", new { }, adminToken))!;
        check(configuredBookInvoice["amount"]!.GetValue<decimal>() == 15000m,
            "Book invoice creation defaults to configured PatientBookFee when amount is omitted");

        db.ChangeTracker.Clear();
        check(await db.RbacAudits.AnyAsync(x => x.Action == "clinic.settings" && x.ActorUserId == adminUserId),
            "Updating clinic settings records an audit trail entry");

        // Restore seed values so downstream suites observe standard baseline parameters until UI changes them.
        await Api(HttpMethod.Put, "clinic-settings", new
        {
            clinicName = initialAdminSettings["clinicName"]!.GetValue<string>(),
            tagline = initialAdminSettings["tagline"]!.GetValue<string>(),
            description = initialAdminSettings["description"]!.GetValue<string>(),
            phone = initialAdminSettings["phone"]!.GetValue<string>(),
            email = initialAdminSettings["email"]!.GetValue<string>(),
            workingHours = initialAdminSettings["workingHours"]!.GetValue<string>(),
            primaryLocationName = initialAdminSettings["primaryLocationName"]!.GetValue<string>(),
            primaryLocationAddress = initialAdminSettings["primaryLocationAddress"]!.GetValue<string>(),
            secondaryLocationName = initialAdminSettings["secondaryLocationName"]?.GetValue<string>(),
            secondaryLocationAddress = initialAdminSettings["secondaryLocationAddress"]?.GetValue<string>(),
            defaultExaminationFee = 150000m,
            patientBookFee = 10000m,
            defaultSlotDurationMinutes = 30,
            defaultMaxPatientsPerSlot = 1,
            lowStockThreshold = 10,
            nearExpiryDays = 30
        }, adminToken);

        return new(createdId, "ui_created_staff", profiles[3].DoctorId);
    }
}

using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.IdentityModel.Tokens;

internal static class Week8Checks
{
    public static async Task VerifyMigrationAsync(ApplicationDbContext db, Action<bool, string> check)
    {
        check(!db.Database.HasPendingModelChanges(), "Week8 EF snapshot matches the current model and permission seeds");
        await using var transaction = await db.Database.BeginTransactionAsync();
        await db.RolePermissions.Where(x => x.PermissionCode == PermissionCodes.SchedulesViewDepartment).ExecuteDeleteAsync();
        await db.Permissions.Where(x => x.Code == PermissionCodes.SchedulesViewDepartment).ExecuteDeleteAsync();
        await db.Roles.Where(x => x.RoleName == RoleConstants.DepartmentHead)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.RoleName, "Week8ExistingRole"));
        var role = new Role { RoleName = RoleConstants.DepartmentHead, Description = "Week8 migration", IsSystem = true };
        db.Roles.Add(role);
        await db.SaveChangesAsync();
        var migration = new ClinicManagement.Migrations.AddDepartmentSchedulePermission();
        var generator = db.GetService<IMigrationsSqlGenerator>();
        for (var i = 0; i < 2; i++)
            foreach (var command in generator.Generate(migration.UpOperations, db.Model))
                await db.Database.ExecuteSqlRawAsync(command.CommandText);
        check(role.RoleId != 6 && await db.RolePermissions.CountAsync(x => x.PermissionCode == PermissionCodes.SchedulesViewDepartment) == 1
            && await db.RolePermissions.AnyAsync(x => x.RoleId == role.RoleId && x.PermissionCode == PermissionCodes.SchedulesViewDepartment),
            "Week8 calendar permission migration is idempotent and resolves the head role by name");
        foreach (var command in generator.Generate(migration.DownOperations, db.Model))
            await db.Database.ExecuteSqlRawAsync(command.CommandText);
        check(!await db.Permissions.AnyAsync(x => x.Code == PermissionCodes.SchedulesViewDepartment)
            && await db.Roles.AnyAsync(x => x.RoleId == role.RoleId), "Week8 rollback preserves roles and unrelated permissions");
        await transaction.RollbackAsync();
        db.ChangeTracker.Clear();
    }

    public static async Task<object> RunAsync(HttpClient client, ApplicationDbContext db, string password,
        string jwtKey, Action<bool, string> check)
    {
        client.DefaultRequestHeaders.Authorization = null;
        async Task<JsonNode?> Send(HttpMethod method, string path, string? token = null, object? body = null, int status = 200)
        {
            using var request = new HttpRequestMessage(method, path);
            if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            body = TestAuthCookies.Apply(request, body);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status, $"Week8 {method} {path.Split('?')[0]}: expected {status}, got {(int)response.StatusCode}"
                + ((int)response.StatusCode == status ? "" : $" {content}"));
            var envelope = string.IsNullOrWhiteSpace(content) ? null : JsonNode.Parse(content);
            TestAuthCookies.Capture(response, envelope);
            return envelope;
        }
        async Task<JsonNode> Session(string name) => (await Send(HttpMethod.Post, "api/auth/login", body: new { username = name, password }))!["result"]!;
        string Token(JsonNode session) => session["accessToken"]!.GetValue<string>();
        var headRole = await db.Roles.Where(x => x.RoleName == RoleConstants.DepartmentHead).Select(x => x.RoleId).SingleAsync();
        User AddUser(string name)
        {
            var user = new User { Username = name, FullName = name, RoleId = headRole,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), CreatedAt = DateTime.UtcNow };
            db.Users.Add(user);
            return user;
        }
        var head = AddUser("week8head");
        var peer = AddUser("week8peer");
        var other = AddUser("week8other");
        var missing = AddUser("week8missing");
        await db.SaveChangesAsync();
        Doctor AddDoctor(User user, int department)
        {
            var doctor = new Doctor { UserId = user.UserId, FullName = user.FullName, Title = "BS",
                DepartmentId = department, SpecializationId = department, IsActive = true };
            db.Doctors.Add(doctor);
            return doctor;
        }
        var headDoctor = AddDoctor(head, 1);
        AddDoctor(peer, 1);
        AddDoctor(other, 2);
        await db.SaveChangesAsync();
        var admin = Token(await Session("testadmin"));
        var doctorToken = Token(await Session("testdoctor"));
        var headSession = await Session(head.Username);
        var headToken = Token(headSession);
        var peerToken = Token(await Session(peer.Username));
        var otherToken = Token(await Session(other.Username));
        var missingToken = Token(await Session(missing.Username));
        var date = new DateOnly(2034, 7, 12);
        var calendar = $"api/doctor-schedules/department?date={date:yyyy-MM-dd}";
        var statistics = $"api/department-head/statistics?fromDate={date:yyyy-MM-dd}&toDate={date:yyyy-MM-dd}";
        foreach (var path in new[] { calendar, "api/doctor-schedules/department/options", statistics })
        {
            await Send(HttpMethod.Get, path, status: 401);
            foreach (var denied in new[] { admin, doctorToken, Token(await Session("testreceptionist")), Token(await Session("testlab")), missingToken })
                await Send(HttpMethod.Get, path, denied, status: 403);
            await Send(HttpMethod.Get, path, headToken);
        }
        await Send(HttpMethod.Get, calendar + "&doctorId=2", headToken, status: 403);
        await Send(HttpMethod.Get, calendar + "&roomId=2", headToken, status: 403);
        var options = (await Send(HttpMethod.Get, "api/doctor-schedules/department/options", headToken))!["result"]!;
        check(options["departmentId"]!.GetValue<int>() == 1 && !options["rooms"]!.AsArray().Any(x => x!["id"]!.GetValue<int>() == 2),
            "Week8 calendar options contain only the authenticated head's department");
        headDoctor.IsActive = false;
        await db.SaveChangesAsync();
        await Send(HttpMethod.Get, calendar, headToken, status: 403);
        headDoctor.IsActive = true;
        await db.SaveChangesAsync();
        var department = await db.Departments.SingleAsync(x => x.DepartmentId == 1);
        department.IsActive = false;
        await db.SaveChangesAsync();
        await Send(HttpMethod.Get, calendar, headToken, status: 403);
        await Send(HttpMethod.Get, "api/doctor-schedules/department/options", headToken, status: 403);
        department.IsActive = true;
        await db.SaveChangesAsync();

        var jwtHandler = new JwtSecurityTokenHandler();
        var original = jwtHandler.ReadJwtToken(headToken);
        string SignedToken(DateTime expires, string signingKey) => jwtHandler.WriteToken(new JwtSecurityToken(
            original.Issuer, original.Audiences.Single(), original.Claims.Where(c => c.Type is not ("exp" or "nbf" or "iat" or "iss" or "aud")),
            DateTime.UtcNow.AddMinutes(-5), expires,
            new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)), SecurityAlgorithms.HmacSha256)));
        foreach (var invalid in new[] { "invalid-token", SignedToken(DateTime.UtcNow.AddSeconds(-10), jwtKey),
                     SignedToken(DateTime.UtcNow.AddMinutes(5), new string('x', 64)) })
        {
            await Send(HttpMethod.Get, calendar, invalid, status: 401);
            await Send(HttpMethod.Post, "hubs/notification/negotiate?negotiateVersion=1&access_token=" + Uri.EscapeDataString(invalid), status: 401);
        }
        await Send(HttpMethod.Get, calendar + "&access_token=" + Uri.EscapeDataString(headToken), status: 401);
        var rotated = (await Send(HttpMethod.Post, "api/auth/refresh", body: new { refreshToken = TestAuthCookies.RawFor(headSession) }))!["result"]!;
        check(rotated["role"]!.GetValue<string>() == RoleConstants.DepartmentHead
            && rotated["permissions"]!.AsArray().Any(x => x!.GetValue<string>() == PermissionCodes.SchedulesViewDepartment),
            "Week8 refresh-cookie rotation preserves current head role and department permissions");
        await Send(HttpMethod.Post, "api/auth/refresh", body: new { refreshToken = TestAuthCookies.RawFor(headSession) }, status: 401);
        headToken = Token(rotated);

        await using var liveHead = await SignalRProbe.ConnectAsync(client.BaseAddress!, headToken);
        await using var livePeer = await SignalRProbe.ConnectAsync(client.BaseAddress!, peerToken);
        await using var liveOther = await SignalRProbe.ConnectAsync(client.BaseAddress!, otherToken);
        await using var liveDoctor = await SignalRProbe.ConnectAsync(client.BaseAddress!, doctorToken);
        await using var liveAdmin = await SignalRProbe.ConnectAsync(client.BaseAddress!, admin);
        var submitted = (await Send(HttpMethod.Post, "api/doctor-schedules/request", doctorToken,
            new { doctorId = 2, departmentId = 2, roomId = 1, workDate = date, startTime = "08:00", endTime = "09:00" }))!["result"]!;
        var requestId = submitted["requestId"]!.GetValue<int>();
        await Task.WhenAll(liveHead.WaitCountAsync(1), livePeer.WaitCountAsync(1));
        check(submitted["doctorId"]!.GetValue<int>() == 1 && submitted["departmentId"]!.GetValue<int>() == 1,
            "Week8 submission ignores caller-supplied doctor and department scope");
        await Send(HttpMethod.Post, $"api/schedule-requests/{requestId}/approve", otherToken, status: 403);
        await Send(HttpMethod.Post, $"api/doctor-schedules/{requestId}/approve", otherToken, status: 403);
        await Task.Delay(150);
        check(liveHead.Count() == 1 && !await db.DoctorSchedules.AnyAsync(x => x.RequestId == requestId),
            "Week8 rejected foreign-department actions emit no department event and create no schedule");
        await Send(HttpMethod.Post, $"api/doctor-schedules/{requestId}/approve", headToken);
        await Task.WhenAll(liveHead.WaitCountAsync(2), livePeer.WaitCountAsync(2), liveDoctor.WaitCountAsync(1, "NotificationReceived"));
        var published = (await Send(HttpMethod.Get, calendar + "&departmentId=2", headToken))!["result"]!.AsArray();
        var stats = (await Send(HttpMethod.Get, statistics + "&departmentId=2", headToken))!["result"]!;
        check(published.Count == 1 && published[0]!["doctorId"]!.GetValue<int>() == 1
            && stats["pendingScheduleRequestCount"]!.GetValue<int>() == 0 && stats["approvedScheduleRequestCount"]!.GetValue<int>() == 1,
            "Week8 delivered approval event is followed by committed own-department calendar and statistics");
        await Send(HttpMethod.Get, $"api/doctor-schedules/available-slots?doctorId=1&date={date:yyyy-MM-dd}");
        var beforeFailed = liveHead.Count();
        await Send(HttpMethod.Post, $"api/schedule-requests/{requestId}/approve", headToken, status: 409);
        await Send(HttpMethod.Post, "api/doctor-schedules/request", doctorToken,
            new { roomId = 1, workDate = date, startTime = "08:30", endTime = "09:30" }, 409);
        await Send(HttpMethod.Post, "api/doctor-schedules", admin,
            new { doctorId = 1, roomId = 2, workDate = date, startTime = "10:00", endTime = "11:00", slotDurationMinutes = 30 }, 400);
        var corrupt = new DoctorScheduleRequest { DoctorId = 1, RoomId = 2, WorkDate = date,
            StartTime = TimeSpan.FromHours(14), EndTime = TimeSpan.FromHours(15), CreatedAt = DateTime.UtcNow };
        db.DoctorScheduleRequests.Add(corrupt);
        await db.SaveChangesAsync();
        await Send(HttpMethod.Post, $"api/schedule-requests/{corrupt.RequestId}/approve", admin, status: 400);
        await Task.Delay(150);
        check(liveHead.Count() == beforeFailed && await db.DoctorSchedules.CountAsync(x => x.RequestId == requestId) == 1,
            "Week8 duplicate, overlapping and malformed cross-department mutations leave no extra event or schedule");
        // Remove the deliberately malformed seed row; A7 counts request ownership by the doctor's department.
        db.DoctorScheduleRequests.Remove(corrupt);
        await db.SaveChangesAsync();

        // The appointment is already InProgress: inserting its first record must still refresh the visit counter.
        var patient = new Patient { FullName = "Week8 private patient", Phone = "0900000800", CreatedAt = DateTime.UtcNow };
        var book = new PatientBook { Patient = patient, BookNumber = "WEEK8-BOOK", Status = "Issued", IssuedAt = DateTime.UtcNow };
        var appointment = new Appointment { DoctorId = 1, PatientProfile = patient, PatientBook = book,
            PatientName = patient.FullName, PatientPhone = patient.Phone, AppointmentDate = date.ToDateTime(TimeOnly.MinValue),
            StartTime = TimeSpan.FromHours(18), EndTime = TimeSpan.FromHours(18.5), Status = "InProgress",
            CheckedInAt = DateTime.UtcNow, BookVerifiedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow };
        db.Appointments.Add(appointment);
        await db.SaveChangesAsync();
        await Send(HttpMethod.Post, "api/medical-records", doctorToken,
            new { appointmentId = appointment.AppointmentId, symptoms = "Week8 private symptoms" }, 201);
        await liveHead.WaitCountAsync(beforeFailed + 1);
        stats = (await Send(HttpMethod.Get, statistics, headToken))!["result"]!;
        check(stats["visitCount"]!.GetValue<int>() == 1 && liveHead.Events.Last(x => x.Name == "DepartmentWorkflowChanged").Payload["area"]!.GetValue<string>() == "Statistics",
            "Week8 first medical record refreshes visit statistics even when appointment status does not change");
        check(liveOther.Count() == 0 && liveDoctor.Count() == 0 && liveAdmin.Count() == 0
            && liveHead.Events.Where(x => x.Name == "DepartmentWorkflowChanged").All(x =>
                x.Payload.AsObject().Select(p => p.Key).ToHashSet().SetEquals(new[] { "departmentId", "area" })
                && x.Payload["departmentId"]!.GetValue<int>() == 1),
            "Week8 invalidations reach only authorized heads in the affected department and expose two non-clinical fields");

        var headRequest = (await Send(HttpMethod.Post, "api/doctor-schedules/request", headToken,
            new { roomId = 1, workDate = date.AddDays(30), startTime = "08:00", endTime = "09:00" }))!["result"]!;
        var headRequestId = headRequest["requestId"]!.GetValue<int>();
        await Send(HttpMethod.Post, $"api/schedule-requests/{headRequestId}/approve", headToken, status: 403);
        await Send(HttpMethod.Post, $"api/doctor-schedules/{headRequestId}/reject", headToken, new { rejectReason = "Self review" }, 403);
        await Send(HttpMethod.Post, $"api/schedule-requests/{headRequestId}/approve", peerToken, status: 403);
        await Send(HttpMethod.Post, $"api/schedule-requests/{headRequestId}/reject", peerToken, new { rejectReason = "Peer head review" }, 403);
        // Wait for the submission before measuring the approval event.
        await liveHead.WaitCountAsync(beforeFailed + 2);
        var beforeAdminApproval = liveHead.Count();
        await Send(HttpMethod.Post, $"api/schedule-requests/{headRequestId}/approve", admin);
        await liveHead.WaitCountAsync(beforeAdminApproval + 1);
        check(await db.DoctorSchedules.AnyAsync(x => x.RequestId == headRequestId),
            "Week8 own and peer-head review are denied; Admin approval refreshes the head's department");
        var beforeDirect = liveHead.Count();
        var direct = (await Send(HttpMethod.Post, "api/doctor-schedules", admin,
            new { doctorId = 1, roomId = 1, workDate = date.AddDays(31), startTime = "10:00", endTime = "11:00", slotDurationMinutes = 30 }))!["result"]!;
        await liveHead.WaitCountAsync(beforeDirect + 1);
        check(direct["totalSlots"]!.GetValue<int>() == 2,
            "Week8 Admin direct publication creates usable slots and refreshes the affected department");

        async Task SetPermissions(IEnumerable<string> codes)
        {
            var role = (await Send(HttpMethod.Get, $"api/rbac/roles/{headRole}", admin))!["result"]!;
            await Send(HttpMethod.Put, $"api/rbac/roles/{headRole}/permissions", admin,
                new { version = role["version"]!.GetValue<string>(), permissionCodes = codes.ToArray() });
        }
        var originalPermissions = await db.RolePermissions.Where(x => x.RoleId == headRole).Select(x => x.PermissionCode).ToArrayAsync();
        await SetPermissions(originalPermissions.Except(new[] { PermissionCodes.SchedulesViewDepartment }));
        await Task.WhenAll(liveHead.WaitClosedAsync(), livePeer.WaitClosedAsync(), liveOther.WaitClosedAsync());
        await Send(HttpMethod.Get, statistics, headToken, status: 401);
        await Send(HttpMethod.Post, "api/auth/refresh", body: new { refreshToken = TestAuthCookies.RawFor(rotated) }, status: 401);
        headToken = Token(await Session(head.Username));
        await Send(HttpMethod.Get, calendar, headToken, status: 403);
        await Send(HttpMethod.Get, "api/doctor-schedules/department/options", headToken, status: 403);
        await Send(HttpMethod.Get, statistics, headToken);
        await SetPermissions(originalPermissions.Except(new[] { PermissionCodes.ReportsDepartmentStatistics }));
        headToken = Token(await Session(head.Username));
        await Send(HttpMethod.Get, calendar, headToken);
        await Send(HttpMethod.Get, statistics, headToken, status: 403);
        await using (var calendarOnly = await SignalRProbe.ConnectAsync(client.BaseAddress!, headToken))
        {
            var record = await db.MedicalRecords.AsNoTracking().SingleAsync(x => x.AppointmentId == appointment.AppointmentId);
            await Send(HttpMethod.Put, $"api/medical-records/{record.MedicalRecordId}", doctorToken,
                new { symptoms = "Updated private symptoms", expectedUpdatedAt = record.UpdatedAt });
            await Task.Delay(150);
            check(calendarOnly.Count() == 0, "Week8 heads without report permission receive no Statistics invalidation");
        }
        await SetPermissions(originalPermissions);
        headToken = Token(await Session(head.Username));
        await using (var revocable = await SignalRProbe.ConnectAsync(client.BaseAddress!, headToken))
        {
            await Send(HttpMethod.Patch, $"api/users/{head.UserId}/status", admin, new { status = false });
            await revocable.WaitClosedAsync();
            await Send(HttpMethod.Get, calendar, headToken, status: 401);
            await Send(HttpMethod.Patch, $"api/users/{head.UserId}/status", admin, new { status = true });
        }
        headToken = Token(await Session(head.Username));
        await using (var reassignable = await SignalRProbe.ConnectAsync(client.BaseAddress!, headToken))
        {
            await Send(HttpMethod.Patch, $"api/users/{head.UserId}/role", admin, new { roleId = 2 });
            await reassignable.WaitClosedAsync();
            await Send(HttpMethod.Get, statistics, headToken, status: 401);
            var changedToken = Token(await Session(head.Username));
            await Send(HttpMethod.Get, calendar, changedToken, status: 403);
            await Send(HttpMethod.Patch, $"api/users/{head.UserId}/role", admin, new { roleId = headRole });
        }
        db.ChangeTracker.Clear();
        // Keep an independent pending request for the production browser integration test.
        var uiRequest = new DoctorScheduleRequest { DoctorId = 1, RoomId = 1, WorkDate = date,
            StartTime = TimeSpan.FromHours(10), EndTime = TimeSpan.FromHours(11), CreatedAt = DateTime.UtcNow };
        db.DoctorScheduleRequests.Add(uiRequest);
        await db.SaveChangesAsync();
        return new { username = head.Username, peerUsername = peer.Username, otherUsername = other.Username,
            date = date.ToString("yyyy-MM-dd"), requestId = uiRequest.RequestId, headDoctorId = headDoctor.DoctorId,
            departmentName = await db.Departments.Where(x => x.DepartmentId == 1).Select(x => x.Name).SingleAsync() };
    }
}

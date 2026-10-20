using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

internal static class Week10Checks
{
    public static async Task<object> RunAsync(HttpClient client, ApplicationDbContext db, string password,
        string jwtKey, Action<bool, string> check)
    {
        client.DefaultRequestHeaders.Authorization = null;
        async Task<JsonNode?> Send(string path, string? token = null, int status = 200, object? body = null,
            HttpMethod? method = null, int? forgedDepartment = null)
        {
            using var request = new HttpRequestMessage(method ?? HttpMethod.Get, path);
            if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (forgedDepartment.HasValue)
            {
                request.Headers.Add("DepartmentId", forgedDepartment.Value.ToString());
                request.Headers.Add("X-Department-Id", forgedDepartment.Value.ToString());
            }
            body = TestAuthCookies.Apply(request, body);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status, $"Week10 {request.Method} {path}: expected {status}, got {(int)response.StatusCode}"
                + ((int)response.StatusCode == status ? "" : $" {content}"));
            var envelope = string.IsNullOrWhiteSpace(content) ? null : JsonNode.Parse(content);
            TestAuthCookies.Capture(response, envelope);
            return envelope;
        }
        async Task<JsonNode> Login(string username) => (await Send("api/auth/login", body: new { username, password }, method: HttpMethod.Post))!["result"]!;
        string Token(JsonNode session) => session["accessToken"]!.GetValue<string>();
        var headRole = await db.Roles.Where(x => x.RoleName == RoleConstants.DepartmentHead).Select(x => x.RoleId).SingleAsync();
        User User(string name, int? roleId = null)
        {
            var user = new User { Username = name, FullName = name, RoleId = roleId ?? headRole,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), CreatedAt = DateTime.UtcNow };
            db.Users.Add(user); return user;
        }
        var headA = User("rc10headA");
        var headB = User("rc10headB");
        var replacement = User("rc10replacement");
        var patientRole = await db.Roles.Where(x => x.RoleName == RoleConstants.Patient).Select(x => x.RoleId).SingleAsync();
        var patient = User("rc10patient", patientRole);
        var customRole = new Role { RoleName = "RC10Reporter", Description = "Authorization fixture", IsSystem = false };
        db.Roles.Add(customRole);
        await db.SaveChangesAsync();
        var custom = User("rc10custom", customRole.RoleId);
        Doctor Doctor(string name, int departmentId, User? user = null)
        {
            var doctor = new Doctor { FullName = name, Title = "BS", DepartmentId = departmentId,
                SpecializationId = departmentId, UserId = user?.UserId, IsActive = true };
            db.Doctors.Add(doctor); return doctor;
        }
        var headDoctorA = Doctor("RC10 Head A", 1, headA);
        var headDoctorB = Doctor("RC10 Head B", 2, headB);
        var doctorA = Doctor("RC10 Doctor A", 1);
        var doctorB = Doctor("RC10 Doctor B", 2);
        await db.SaveChangesAsync();
        var date = new DateOnly(2038, 6, 12);
        DoctorScheduleRequest Request(Doctor doctor, int roomId, int hour, string status, DateOnly? day = null)
        {
            var request = new DoctorScheduleRequest { DoctorId = doctor.DoctorId, RoomId = roomId, WorkDate = day ?? date,
                StartTime = TimeSpan.FromHours(hour), EndTime = TimeSpan.FromHours(hour + 1), Status = status, CreatedAt = DateTime.UtcNow };
            db.DoctorScheduleRequests.Add(request); return request;
        }
        DoctorSchedule Schedule(Doctor doctor, int roomId, int hour, DoctorScheduleRequest? request = null, string status = "Approved", bool active = true)
        {
            var schedule = new DoctorSchedule { DoctorId = doctor.DoctorId, RoomId = roomId, WorkDate = date,
                StartTime = TimeSpan.FromHours(hour), EndTime = TimeSpan.FromHours(hour + 1), Request = request,
                Status = status, IsActive = active, MaxPatients = 2, CreatedAt = DateTime.UtcNow,
                TimeSlots = new List<TimeSlot> { new() { StartTime = TimeSpan.FromHours(hour), EndTime = TimeSpan.FromHours(hour + 0.5) },
                    new() { StartTime = TimeSpan.FromHours(hour + 0.5), EndTime = TimeSpan.FromHours(hour + 1) } } };
            db.DoctorSchedules.Add(schedule); return schedule;
        }
        var requestA = Request(doctorA, 1, 12, "Pending");
        var requestB = Request(doctorB, 2, 12, "Pending");
        Request(doctorB, 2, 13, "Pending");
        var approvedA = Request(doctorA, 1, 8, "Approved");
        var approvedB = Request(doctorB, 2, 9, "Approved");
        var ownA = Request(headDoctorA, 1, 8, "Pending", date.AddDays(1));
        var ownB = Request(headDoctorB, 2, 8, "Pending", date.AddDays(1));
        var scheduleA = Schedule(doctorA, 1, 8, approvedA);
        var scheduleB = Schedule(doctorB, 2, 9, approvedB);
        Schedule(doctorB, 2, 10);
        var mixed = Schedule(doctorA, 2, 18);
        Schedule(doctorA, 1, 19, status: "Pending");
        Schedule(doctorA, 1, 20, active: false);
        void Visit(Doctor doctor, int hour, Doctor? recordDoctor = null)
        {
            db.Appointments.Add(new Appointment { DoctorId = doctor.DoctorId, AppointmentDate = date.ToDateTime(TimeOnly.MinValue),
                StartTime = TimeSpan.FromHours(hour), EndTime = TimeSpan.FromHours(hour + 0.5), Status = "Completed",
                PatientName = "RC10_PRIVATE_PATIENT", PatientPhone = "0900000010", Reason = "RC10_PRIVATE_REASON", CreatedAt = DateTime.UtcNow,
                MedicalRecord = new MedicalRecord { DoctorId = (recordDoctor ?? doctor).DoctorId, ExaminationDate = date.ToDateTime(TimeOnly.MinValue),
                    Symptoms = "RC10_PRIVATE_SYMPTOMS", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow } });
        }
        Visit(doctorA, 8); Visit(doctorB, 9); Visit(doctorB, 10); Visit(doctorB, 11, doctorA);
        await db.SaveChangesAsync();
        var sessionA = await Login(headA.Username);
        var sessionB = await Login(headB.Username);
        var replacementSession = await Login(replacement.Username);
        var tokenA = Token(sessionA); var tokenB = Token(sessionB);
        var admin = Token(await Login("testadmin"));
        var calendar = $"api/doctor-schedules/department?date={date:yyyy-MM-dd}";
        var statistics = $"api/department-head/statistics?fromDate={date:yyyy-MM-dd}&toDate={date:yyyy-MM-dd}";
        async Task Counts(string token, int departmentId, int visits, int pending)
        {
            var envelope = (await Send(statistics + $"&departmentId={3 - departmentId}", token,
                body: new { departmentId = 3 - departmentId }, forgedDepartment: 3 - departmentId))!;
            var result = envelope["result"]!;
            check(result["departmentId"]!.GetValue<int>() == departmentId && result["visitCount"]!.GetValue<int>() == visits
                && result["pendingScheduleRequestCount"]!.GetValue<int>() == pending && result["approvedScheduleRequestCount"]!.GetValue<int>() == 1
                && result.AsObject().Count == 7 && !envelope.ToJsonString().Contains("RC10_PRIVATE", StringComparison.Ordinal),
                $"Week10 department {departmentId} statistics resist header/body/query tampering and exclude inconsistent visits");
        }
        foreach (var (token, departmentId, ownDoctor, foreignDoctor, ownSchedule, foreignSchedule, ownRequest, foreignRequest, selfRequest, count) in new[]
                 { (tokenA, 1, doctorA, doctorB, scheduleA, scheduleB, requestA, requestB, ownA, 1),
                   (tokenB, 2, doctorB, doctorA, scheduleB, scheduleA, requestB, requestA, ownB, 2) })
        {
            var rows = (await Send(calendar + $"&departmentId={3 - departmentId}", token,
                body: new { departmentId = 3 - departmentId }, forgedDepartment: 3 - departmentId))!["result"]!.AsArray();
            check(rows.Count == count && rows.All(x => x!["doctorId"]!.GetValue<int>() == ownDoctor.DoctorId),
                $"Week10 department {departmentId} calendar excludes foreign, mixed-room, inactive and unpublished shifts");
            var published = (await Send($"api/doctor-schedules?date={date:yyyy-MM-dd}&doctorId={ownDoctor.DoctorId}", token))!["result"]!;
            check(published["totalItems"]!.GetValue<int>() == count, "Week10 public schedule query remains scoped for an authenticated head");
            await Send($"api/doctor-schedules/{ownSchedule.ScheduleId}", token);
            await Send($"api/doctor-schedules/{foreignSchedule.ScheduleId}", token, 404);
            await Send($"api/doctor-schedules/{mixed.ScheduleId}", token, 404);
            foreach (var path in new[] { calendar, $"api/doctor-schedules?date={date:yyyy-MM-dd}", "api/schedule-requests?status=Pending" })
            {
                await Send(path + $"&doctorId={foreignDoctor.DoctorId}", token, 403);
                await Send(path + $"&roomId={3 - departmentId}", token, 403);
            }
            foreach (var path in new[] { "api/doctor-schedules/available-slots", "api/appointments/available-slots" })
            {
                await Send($"{path}?doctorId={foreignDoctor.DoctorId}&date={date:yyyy-MM-dd}", token, 403);
                var slots = (await Send($"{path}?doctorId={ownDoctor.DoctorId}&date={date:yyyy-MM-dd}", token))!["result"]!.AsArray();
                check(slots.Count == count * 2, "Week10 both slot APIs exclude mixed-department and unpublished schedules");
            }
            await Send($"api/schedule-requests/{foreignRequest.RequestId}", token, 403);
            await Send($"api/schedule-requests/{foreignRequest.RequestId}/approve", token, 403, method: HttpMethod.Post);
            await Send($"api/doctor-schedules/{selfRequest.RequestId}/approve", token, 403, method: HttpMethod.Post);
            var ownRows = (await Send("api/doctor-schedules/my-requests", token))!["result"]!.AsArray();
            check(ownRows.Count == 1 && ownRows[0]!["requestId"]!.GetValue<int>() == selfRequest.RequestId,
                "Week10 personal requests use authenticated doctor linkage, not numeric ID coincidence");
            await Counts(token, departmentId, count, count);
        }
        foreach (var path in new[] { "api/doctor-schedules?weekStart=9999-12-31", "api/doctor-schedules?date=0001-01-01",
                     $"api/doctor-schedules?date={date:yyyy-MM-dd}&weekStart={date:yyyy-MM-dd}",
                     "api/doctor-schedules?pageNumber=2147483647&pageSize=100",
                     "api/schedule-requests?pageNumber=2147483647&pageSize=100",
                     "api/doctor-schedules/department?weekStart=9999-12-31", "api/doctor-schedules/department" })
            await Send(path, tokenA, 400);
        await Send("api/doctor-schedules?weekStart=9999-12-25");
        await Send($"api/doctor-schedules?date={date:yyyy-MM-dd}&pageNumber=0&pageSize=0", tokenA);
        await Send("api/doctor-schedules/request", tokenA, 400,
            new { roomId = 1, workDate = date.AddDays(40), startTime = "23:00", endTime = "24:00" }, HttpMethod.Post);
        await Send("api/doctor-schedules", admin, 400,
            new { doctorId = doctorA.DoctorId, roomId = 1, workDate = date.AddDays(40), startTime = "23:00", endTime = "24:00", slotDurationMinutes = 30 }, HttpMethod.Post);

        var codes = new[] { PermissionCodes.SchedulesViewDepartment, PermissionCodes.ReportsDepartmentStatistics, PermissionCodes.SchedulesReview };
        var original = await db.RolePermissions.AsNoTracking().Where(x => x.RoleId == headRole && codes.Contains(x.PermissionCode)).Select(x => x.PermissionCode).ToArrayAsync();
        try
        {
            for (var mask = 0; mask < 8; mask++)
            {
                db.ChangeTracker.Clear();
                await db.RolePermissions.Where(x => x.RoleId == headRole && codes.Contains(x.PermissionCode)).ExecuteDeleteAsync();
                db.RolePermissions.AddRange(codes.Where((_, index) => (mask & 1 << index) != 0)
                    .Select(code => new RolePermission { RoleId = headRole, PermissionCode = code }));
                await db.SaveChangesAsync();
                await Send(calendar, tokenA, (mask & 1) != 0 ? 200 : 403);
                await Send("api/doctor-schedules/department/options", tokenA, (mask & 1) != 0 ? 200 : 403);
                await Send(statistics, tokenA, (mask & 2) != 0 ? 200 : 403);
                await Send("api/schedule-requests", tokenA, (mask & 4) != 0 ? 200 : 403);
            }
        }
        finally
        {
            db.ChangeTracker.Clear();
            await db.RolePermissions.Where(x => x.RoleId == headRole && codes.Contains(x.PermissionCode)).ExecuteDeleteAsync();
            db.RolePermissions.AddRange(original.Select(code => new RolePermission { RoleId = headRole, PermissionCode = code }));
            await db.SaveChangesAsync();
        }
        foreach (var username in new[] { "testadmin", "testdoctor", "testreceptionist", "testlab", patient.Username, custom.Username })
        {
            var session = await Login(username);
            var roleId = await db.Users.Where(x => x.Username == username).Select(x => x.RoleId).SingleAsync();
            var existing = await db.RolePermissions.AsNoTracking().Where(x => x.RoleId == roleId).Select(x => x.PermissionCode).ToArrayAsync();
            var injected = codes.Except(existing).ToArray();
            db.RolePermissions.AddRange(injected.Select(code => new RolePermission { RoleId = roleId, PermissionCode = code }));
            await db.SaveChangesAsync();
            try
            {
                await Send(calendar, Token(session), 403);
                await Send("api/doctor-schedules/department/options", Token(session), 403);
                await Send(statistics, Token(session), 403);
            }
            finally
            {
                db.ChangeTracker.Clear();
                await db.RolePermissions.Where(x => x.RoleId == roleId && injected.Contains(x.PermissionCode)).ExecuteDeleteAsync();
            }
        }
        db.RolePermissions.Add(new RolePermission { RoleId = headRole, PermissionCode = PermissionCodes.SchedulesManage });
        await db.SaveChangesAsync();
        try
        {
            await Send("api/doctor-schedules", tokenA, 403,
                new { doctorId = doctorB.DoctorId, roomId = 2, workDate = date.AddDays(40), startTime = "08:00", endTime = "09:00", slotDurationMinutes = 30 }, HttpMethod.Post);
        }
        finally
        {
            db.ChangeTracker.Clear();
            await db.RolePermissions.Where(x => x.RoleId == headRole && x.PermissionCode == PermissionCodes.SchedulesManage).ExecuteDeleteAsync();
        }

        string Signed(string token, string claim, string value)
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);
            return handler.WriteToken(new JwtSecurityToken(jwt.Issuer, jwt.Audiences.Single(),
                jwt.Claims.Where(c => c.Type != claim && c.Type is not ("exp" or "nbf" or "iat" or "iss" or "aud")).Append(new Claim(claim, value)),
                DateTime.UtcNow.AddMinutes(-1), DateTime.UtcNow.AddMinutes(10),
                new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), SecurityAlgorithms.HmacSha256)));
        }
        await Counts(Signed(tokenA, "departmentId", "2"), 1, 1, 1);
        await Send(calendar, Signed(tokenA, ClaimConstants.Role, RoleConstants.Admin), 401);
        await db.Departments.Where(x => x.DepartmentId == 1).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsActive, false));
        try
        {
            foreach (var path in new[] { calendar, statistics, "api/doctor-schedules/rooms", "api/doctor-schedules/my-requests" })
                await Send(path, tokenA, 403);
        }
        finally { await db.Departments.Where(x => x.DepartmentId == 1).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsActive, true)); }
        await using var oldA = await SignalRProbe.ConnectAsync(client.BaseAddress!, tokenA);
        await using var oldB = await SignalRProbe.ConnectAsync(client.BaseAddress!, tokenB);
        await using var incoming = await SignalRProbe.ConnectAsync(client.BaseAddress!, Token(replacementSession));
        await Send($"api/doctors/{headDoctorA.DoctorId}/account", admin, 400, new { userId = headB.UserId }, HttpMethod.Patch);
        await Send($"api/doctors/{headDoctorA.DoctorId}/account", admin, body: new { userId = headA.UserId }, method: HttpMethod.Patch);
        sessionA = (await Send("api/auth/refresh", body: new { refreshToken = TestAuthCookies.RawFor(sessionA) }, method: HttpMethod.Post))!["result"]!;
        await Send(calendar, tokenA);
        await Send($"api/doctors/{headDoctorA.DoctorId}/account", admin, body: new { userId = replacement.UserId }, method: HttpMethod.Patch);
        await Task.WhenAll(oldA.WaitClosedAsync(), incoming.WaitClosedAsync());
        foreach (var session in new[] { sessionA, replacementSession })
        {
            await Send(calendar, Token(session), 401);
            await Send("api/auth/refresh", status: 401, body: new { refreshToken = TestAuthCookies.RawFor(session) }, method: HttpMethod.Post);
        }
        await Send(calendar, tokenB);
        var reassigned = Token(await Login(replacement.Username));
        await Counts(reassigned, 1, 1, 1);
        var detached = Token(await Login(headA.Username));
        await Send(statistics, detached, 403);
        await Send($"api/doctors/{headDoctorB.DoctorId}/account", admin, body: new { userId = headA.UserId }, method: HttpMethod.Patch);
        await oldB.WaitClosedAsync();
        await Send(calendar, tokenB, 401);
        var moved = Token(await Login(headA.Username));
        await Counts(Signed(moved, "departmentId", "1"), 2, 2, 2);
        await Send(calendar + $"&doctorId={doctorA.DoctorId}", moved, 403);
        await Send($"api/schedule-requests/{requestA.RequestId}", moved, 403);
        var movedRows = (await Send(calendar, moved))!["result"]!.AsArray();
        check(movedRows.Count == 2 && movedRows.All(x => x!["doctorId"]!.GetValue<int>() == doctorB.DoctorId),
            "Week10 relinking the same UserId to another department changes all authority without trusting stale JWT scope claims");
        check(await db.RbacAudits.CountAsync(x => x.Action == "doctor.account" && (x.EntityId == headDoctorA.DoctorId || x.EntityId == headDoctorB.DoctorId)) == 2,
            "Week10 real linkage changes are audited once; failed and no-op links create no access-change audit");
        var raceUser = User("rc10race");
        await db.SaveChangesAsync();
        var raceA = Doctor("RC10 race A", 1); var raceB = Doctor("RC10 race B", 2);
        await db.SaveChangesAsync();
        var concurrent = await Task.WhenAll(new[] { raceA.DoctorId, raceB.DoctorId }.Select(async doctorId =>
        {
            using var request = new HttpRequestMessage(HttpMethod.Patch, $"api/doctors/{doctorId}/account");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", admin);
            request.Content = JsonContent.Create(new { userId = raceUser.UserId });
            using var response = await client.SendAsync(request);
            return (int)response.StatusCode;
        }));
        check(concurrent.Count(status => status == 200) == 1 && concurrent.Count(status => status is 400 or 409) == 1
            && await db.Doctors.CountAsync(x => x.UserId == raceUser.UserId) == 1,
            $"Week10 concurrent account links grant exactly one department and return a controlled error for the loser ({string.Join(',', concurrent)})");
        return new { username = replacement.Username, otherUsername = headA.Username, missingUsername = headB.Username,
            date = date.ToString("yyyy-MM-dd"), doctorAId = doctorA.DoctorId, doctorBId = doctorB.DoctorId,
            headDoctorAId = headDoctorA.DoctorId, headDoctorBId = headDoctorB.DoctorId,
            userAId = replacement.UserId, userBId = headA.UserId, missingUserId = headB.UserId,
            scheduleAId = scheduleA.ScheduleId, scheduleBId = scheduleB.ScheduleId, requestAId = requestA.RequestId,
            departmentA = await db.Departments.Where(x => x.DepartmentId == 1).Select(x => x.Name).SingleAsync(),
            departmentB = await db.Departments.Where(x => x.DepartmentId == 2).Select(x => x.Name).SingleAsync() };
    }
}

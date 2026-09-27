using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

internal static class ScheduleReviewChecks
{
    public static async Task VerifyRoleMigrationCollisionAsync(ApplicationDbContext source, Action<bool, string> check)
    {
        var connection = new SqlConnectionStringBuilder(source.Database.GetDbConnection().ConnectionString)
        {
            InitialCatalog = "ClinicA4RoleCollision_" + Guid.NewGuid().ToString("N")
        };
        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(connection.ConnectionString).Options;
        await using var db = new ApplicationDbContext(options);
        try
        {
            var migrations = db.Database.GetMigrations().ToArray();
            await db.GetService<IMigrator>().MigrateAsync(migrations[^2]);
            await db.Database.ExecuteSqlRawAsync(@"
SET IDENTITY_INSERT Roles ON;
INSERT INTO Roles (RoleId, RoleName, Description, IsSystem)
VALUES (6, 'ExistingCustomRole', 'Existing custom role', 0);
SET IDENTITY_INSERT Roles OFF;
");
            await db.Database.MigrateAsync();
            var headId = await db.Roles.Where(x => x.RoleName == "DepartmentHead").Select(x => x.RoleId).SingleAsync();
            check(headId != 6 && await db.Roles.AnyAsync(x => x.RoleId == 6 && x.RoleName == "ExistingCustomRole"),
                "Migration preserves an existing custom RoleId 6 and allocates DepartmentHead separately");
        }
        finally
        {
            await db.Database.EnsureDeletedAsync();
        }
    }

    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password, Action<bool, string> check)
    {
        async Task<JsonNode?> Send(HttpMethod method, string path, object? body = null, int status = 200, string? token = null)
        {
            using var request = new HttpRequestMessage(method, path);
            if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status,
                $"A4 {method} {path}: expected {status}, got {(int)response.StatusCode}"
                + ((int)response.StatusCode == status ? "" : $": {content}"));
            return string.IsNullOrWhiteSpace(content) ? null : JsonNode.Parse(content);
        }
        async Task<string> Login(string name) => (await Send(HttpMethod.Post, "api/auth/login",
            new { username = name, password }))!["result"]!["accessToken"]!.GetValue<string>();

        client.DefaultRequestHeaders.Authorization = null;
        var adminToken = await Login("testadmin");
        var doctorToken = await Login("testdoctor");
        var head = new User { Username = "a4head", FullName = "A4 head", PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), RoleId = 6, CreatedAt = DateTime.UtcNow };
        var secondHead = new User { Username = "a4head2", FullName = "A4 head 2", PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), RoleId = 6, CreatedAt = DateTime.UtcNow };
        db.Users.AddRange(head, secondHead);
        await db.SaveChangesAsync();
        var headDoctor = new Doctor { FullName = "A4 head", Title = "BS", DepartmentId = 1, SpecializationId = 1, UserId = head.UserId, IsActive = true };
        var secondHeadDoctor = new Doctor { FullName = "A4 head 2", Title = "BS", DepartmentId = 1, SpecializationId = 1, UserId = secondHead.UserId, IsActive = true };
        var peerDoctor = new Doctor { FullName = "A4 peer", Title = "BS", DepartmentId = 1, SpecializationId = 1, IsActive = true };
        db.Doctors.AddRange(headDoctor, secondHeadDoctor, peerDoctor);
        var alternateRoom = new Room { RoomNumber = "A4-ALT", Name = "A4 alternate room", DepartmentId = 1, IsActive = true };
        db.Rooms.Add(alternateRoom);
        await db.SaveChangesAsync();
        var headToken = await Login("a4head");
        var secondHeadToken = await Login("a4head2");
        await Send(HttpMethod.Get, "api/test/doctor", token: headToken);
        await Send(HttpMethod.Get, "api/schedule-requests", status: 401);
        await Send(HttpMethod.Get, "api/schedule-requests", status: 403, token: doctorToken);

        var date = DateOnly.FromDateTime(DateTime.Today.AddDays(50));
        DoctorScheduleRequest Add(int doctorId, int roomId, string start, string end, DateOnly? workDate = null)
        {
            var request = new DoctorScheduleRequest
            {
                DoctorId = doctorId, RoomId = roomId, WorkDate = workDate ?? date,
                StartTime = TimeSpan.Parse(start), EndTime = TimeSpan.Parse(end), CreatedAt = DateTime.UtcNow
            };
            db.DoctorScheduleRequests.Add(request);
            return request;
        }
        var sameDepartment = Add(1, 1, "09:00", "10:00");
        var otherDepartment = Add(2, 2, "09:00", "10:00");
        var own = Add(headDoctor.DoctorId, 1, "11:00", "12:00");
        var rejected = Add(peerDoctor.DoctorId, 1, "13:00", "14:00");
        await db.SaveChangesAsync();

        var scoped = (await Send(HttpMethod.Get, "api/schedule-requests?status=Pending", token: headToken))!["result"]!;
        check(scoped["totalItems"]!.GetValue<int>() == 3, "Head list excludes other departments");
        await Send(HttpMethod.Get, $"api/schedule-requests/{otherDepartment.RequestId}", status: 403, token: headToken);
        await Send(HttpMethod.Post, $"api/schedule-requests/{otherDepartment.RequestId}/approve", status: 403, token: headToken);
        await Send(HttpMethod.Post, $"api/schedule-requests/{otherDepartment.RequestId}/reject",
            new { rejectReason = "Không thuộc khoa" }, status: 403, token: headToken);
        await Send(HttpMethod.Post, $"api/schedule-requests/{own.RequestId}/approve", status: 403, token: headToken);
        await Send(HttpMethod.Post, $"api/schedule-requests/{own.RequestId}/reject",
            new { rejectReason = "Không tự duyệt" }, status: 403, token: headToken);
        var ownDetail = (await Send(HttpMethod.Get, $"api/schedule-requests/{own.RequestId}", token: headToken))!["result"]!;
        check(!ownDetail["canReview"]!.GetValue<bool>(), "Head sees own request but cannot review it");
        await Send(HttpMethod.Post, $"api/schedule-requests/{sameDepartment.RequestId}/approve", status: 403, token: adminToken);
        var pendingSlots = (await Send(HttpMethod.Get,
            $"api/appointments/available-slots?doctorId=1&date={date:yyyy-MM-dd}"))!["result"]!.AsArray();
        check(pendingSlots.Count == 0, "Pending requests do not open booking slots");

        var invalidReason = (await Send(HttpMethod.Post, $"api/schedule-requests/{rejected.RequestId}/reject", new { rejectReason = " " }, 400, headToken))!;
        check(invalidReason["code"]!.GetValue<int>() == 1001, "Missing rejection reason uses ApiResponse error format");
        await Send(HttpMethod.Post, $"api/schedule-requests/{rejected.RequestId}/reject", new { rejectReason = "Phòng chưa sẵn sàng" }, token: headToken);
        var savedRejection = await db.DoctorScheduleRequests.AsNoTracking().SingleAsync(x => x.RequestId == rejected.RequestId);
        check(savedRejection.Status == "Rejected" && savedRejection.ReviewerId == head.UserId
            && savedRejection.ReviewedAt != null && !string.IsNullOrWhiteSpace(savedRejection.RejectReason)
            && !await db.DoctorSchedules.AnyAsync(x => x.RequestId == rejected.RequestId),
            "Rejection persists reason, reviewer and time without opening a schedule");

        await Send(HttpMethod.Post, $"api/schedule-requests/{sameDepartment.RequestId}/approve", token: headToken);
        var approved = await db.DoctorScheduleRequests.AsNoTracking().SingleAsync(x => x.RequestId == sameDepartment.RequestId);
        check(approved.Status == "Approved" && approved.ReviewerId == head.UserId && approved.ReviewedAt != null
            && await db.DoctorSchedules.CountAsync(x => x.RequestId == sameDepartment.RequestId) == 1,
            "Head approval creates exactly one linked schedule");
        var slots = (await Send(HttpMethod.Get,
            $"api/appointments/available-slots?doctorId=1&date={date:yyyy-MM-dd}"))!["result"]!.AsArray();
        check(slots.Count == 2, "Approved request opens 30-minute slots");
        await Send(HttpMethod.Post, $"api/schedule-requests/{sameDepartment.RequestId}/approve", status: 409, token: headToken);

        var doctorConflict = Add(1, alternateRoom.RoomId, "09:30", "10:30");
        var roomConflict = Add(peerDoctor.DoctorId, 1, "09:30", "10:30");
        var adjacent = Add(1, 1, "10:00", "10:30");
        await db.SaveChangesAsync();
        await Send(HttpMethod.Post, $"api/schedule-requests/{doctorConflict.RequestId}/approve", status: 409, token: headToken);
        await Send(HttpMethod.Post, $"api/schedule-requests/{roomConflict.RequestId}/approve", status: 409, token: headToken);
        await Send(HttpMethod.Post, $"api/schedule-requests/{adjacent.RequestId}/approve", token: headToken);

        await Send(HttpMethod.Post, $"api/schedule-requests/{own.RequestId}/approve", token: adminToken);
        check(await db.DoctorSchedules.CountAsync(x => x.RequestId == own.RequestId) == 1,
            "Admin approves a DepartmentHead request");
        await Send(HttpMethod.Post, $"api/schedule-requests/{own.RequestId}/approve", status: 409, token: adminToken);
        var headRejection = Add(headDoctor.DoctorId, 1, "12:00", "12:30");
        await db.SaveChangesAsync();
        await Send(HttpMethod.Post, $"api/schedule-requests/{headRejection.RequestId}/reject",
            new { rejectReason = "Điều chỉnh phòng khám" }, token: adminToken);
        check((await db.DoctorScheduleRequests.AsNoTracking().SingleAsync(x => x.RequestId == headRejection.RequestId)).ReviewerId
            == (await db.Users.SingleAsync(x => x.Username == "testadmin")).UserId,
            "Admin can reject a DepartmentHead request");

        var concurrentDate = date.AddDays(1);
        var a = Add(1, 1, "08:00", "09:00", concurrentDate);
        var b = Add(peerDoctor.DoctorId, 1, "08:30", "09:30", concurrentDate);
        await db.SaveChangesAsync();
        var concurrent = await Task.WhenAll(new[] { (a.RequestId, headToken), (b.RequestId, secondHeadToken) }.Select(async pair =>
        {
            using var message = new HttpRequestMessage(HttpMethod.Post, $"api/schedule-requests/{pair.RequestId}/approve");
            message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", pair.Item2);
            using var response = await client.SendAsync(message);
            return response.StatusCode;
        }));
        check(concurrent.Count(x => x == HttpStatusCode.OK) == 1 && concurrent.Count(x => x == HttpStatusCode.Conflict) == 1,
            $"Concurrent conflicting approvals commit one schedule and return 409 for the other ({string.Join(", ", concurrent)})");

        var duplicate = Add(peerDoctor.DoctorId, 1, "10:00", "11:00", concurrentDate);
        await db.SaveChangesAsync();
        var duplicateResults = await Task.WhenAll(new[] { headToken, secondHeadToken }.Select(async token =>
        {
            using var message = new HttpRequestMessage(HttpMethod.Post, $"api/schedule-requests/{duplicate.RequestId}/approve");
            message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            using var response = await client.SendAsync(message);
            return response.StatusCode;
        }));
        check(duplicateResults.Count(x => x == HttpStatusCode.OK) == 1 && duplicateResults.Count(x => x == HttpStatusCode.Conflict) == 1
            && await db.DoctorSchedules.CountAsync(x => x.RequestId == duplicate.RequestId) == 1,
            $"Two heads cannot approve the same request twice ({string.Join(", ", duplicateResults)})");
    }
}

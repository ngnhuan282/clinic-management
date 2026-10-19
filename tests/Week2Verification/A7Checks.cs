using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Repositories.Implementations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

internal static class A7Checks
{
    public static async Task VerifyPermissionMigrationAsync(ApplicationDbContext db, Action<bool, string> check)
    {
        // Exercise only A7's data migration in a rollback transaction, including a non-6 head RoleId.
        await using var transaction = await db.Database.BeginTransactionAsync();
        await db.RolePermissions.Where(x => x.PermissionCode == PermissionCodes.ReportsDepartmentStatistics).ExecuteDeleteAsync();
        await db.Permissions.Where(x => x.Code == PermissionCodes.ReportsDepartmentStatistics).ExecuteDeleteAsync();
        await db.Roles.Where(x => x.RoleName == RoleConstants.DepartmentHead)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.RoleName, "A7ExistingRole"));
        var relocatedHead = new Role { RoleName = RoleConstants.DepartmentHead, Description = "A7 migration check", IsSystem = true };
        db.Roles.Add(relocatedHead);
        await db.SaveChangesAsync();
        var migration = new ClinicManagement.Migrations.AddDepartmentStatisticsPermission();
        var generator = db.GetService<IMigrationsSqlGenerator>();
        foreach (var iteration in Enumerable.Range(0, 2))
            foreach (var command in generator.Generate(migration.UpOperations, db.Model))
                await db.Database.ExecuteSqlRawAsync(command.CommandText);
        check(relocatedHead.RoleId != 6
            && await db.Permissions.CountAsync(x => x.Code == PermissionCodes.ReportsDepartmentStatistics) == 1
            && await db.RolePermissions.CountAsync(x => x.PermissionCode == PermissionCodes.ReportsDepartmentStatistics) == 1
            && await db.RolePermissions.AnyAsync(x => x.RoleId == relocatedHead.RoleId && x.PermissionCode == PermissionCodes.ReportsDepartmentStatistics),
            "A7 migration is idempotent, resolves DepartmentHead by name and preserves a different role at ID 6");
        foreach (var command in generator.Generate(migration.DownOperations, db.Model))
            await db.Database.ExecuteSqlRawAsync(command.CommandText);
        check(!await db.Permissions.AnyAsync(x => x.Code == PermissionCodes.ReportsDepartmentStatistics)
            && await db.Roles.AnyAsync(x => x.RoleId == relocatedHead.RoleId), "A7 rollback removes only its permission, preserving roles");
        await transaction.RollbackAsync();
        db.ChangeTracker.Clear();
    }

    public static async Task<object> RunAsync(HttpClient client, ApplicationDbContext db, string password,
        Action<bool, string> check)
    {
        const string endpoint = "api/department-head/statistics";
        const string period = "?fromDate=2031-05-01&toDate=2031-05-31";
        async Task<JsonNode> Send(string path, string? token, int status = 200, object? body = null,
            HttpMethod? method = null, bool tamperHeaders = false)
        {
            using var request = new HttpRequestMessage(method ?? HttpMethod.Get, path);
            if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            if (tamperHeaders)
            {
                request.Headers.Add("DepartmentId", "2");
                request.Headers.Add("X-Department-Id", "2");
            }
            using var response = await client.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status,
                $"A7 {path}: expected {status}, got {(int)response.StatusCode}"
                + ((int)response.StatusCode == status ? "" : $" {content}"));
            return JsonNode.Parse(content)!;
        }
        async Task<string> Login(string username) => (await Send("api/auth/login", null, body: new { username, password },
            method: HttpMethod.Post))["result"]!["accessToken"]!.GetValue<string>();
        void Error(JsonNode response, int code, bool fields = false) => check(
            response["code"]!.GetValue<int>() == code && response["result"] is null
            && !string.IsNullOrWhiteSpace(response["message"]!.GetValue<string>())
            && (!fields || response["errors"]!.AsObject().Count > 0), "A7 stable ApiResponse error contract");
        void Counts(JsonNode envelope, int visits, int pending, int approved)
        {
            var result = envelope["result"]!;
            check(envelope["code"]!.GetValue<int>() == 1000 && result["departmentId"]!.GetValue<int>() == 1
                && result["departmentName"]!.GetValue<string>() == "Noi tong quat"
                && result["fromDate"]!.GetValue<string>() == "2031-05-01"
                && result["toDate"]!.GetValue<string>() == "2031-05-31"
                && result["visitCount"]!.GetValue<int>() == visits
                && result["pendingScheduleRequestCount"]!.GetValue<int>() == pending
                && result["approvedScheduleRequestCount"]!.GetValue<int>() == approved,
                $"A7 scoped counts are {visits}/{pending}/{approved} with the frozen period and department");
            check(result.AsObject().Select(x => x.Key).ToHashSet().SetEquals(new[] { "departmentId", "departmentName",
                "fromDate", "toDate", "visitCount", "pendingScheduleRequestCount", "approvedScheduleRequestCount" }),
                "A7 DTO exposes exactly seven aggregate fields and no patient or revenue data");
        }

        client.DefaultRequestHeaders.Authorization = null;
        var headRoleId = await db.Roles.Where(x => x.RoleName == RoleConstants.DepartmentHead).Select(x => x.RoleId).SingleAsync();
        check(await db.RolePermissions.AnyAsync(x => x.RoleId == headRoleId && x.PermissionCode == PermissionCodes.ReportsDepartmentStatistics)
            && !await db.RolePermissions.AnyAsync(x => x.RoleId != headRoleId && x.PermissionCode == PermissionCodes.ReportsDepartmentStatistics),
            "A7 data migration grants only the DepartmentHead role its scoped report permission");
        User AddHead(string name)
        {
            var user = new User { Username = name, FullName = name, RoleId = headRoleId,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), CreatedAt = DateTime.UtcNow };
            db.Users.Add(user);
            return user;
        }
        var head = AddHead("a7head");
        var missing = AddHead("a7missing");
        var otherHead = AddHead("a7head2");
        await db.SaveChangesAsync();
        var headDoctor = new Doctor { UserId = head.UserId, FullName = "A7 head", DepartmentId = 1, SpecializationId = 1, Title = "BS" };
        var otherHeadDoctor = new Doctor { UserId = otherHead.UserId, FullName = "A7 head B", DepartmentId = 2, SpecializationId = 2, Title = "BS" };
        db.Doctors.AddRange(headDoctor, otherHeadDoctor);
        await db.SaveChangesAsync();
        var headToken = await Login(head.Username);
        var missingToken = await Login(missing.Username);
        var otherToken = await Login(otherHead.Username);
        var adminToken = await Login("testadmin");
        var doctorToken = await Login("testdoctor");
        var adminId = await db.Users.Where(x => x.Username == "testadmin").Select(x => x.UserId).SingleAsync();
        var doctorId = await db.Users.Where(x => x.Username == "testdoctor").Select(x => x.UserId).SingleAsync();
        Error(await Send(endpoint, null, 401), 1002);
        Error(await Send(endpoint, "invalid-token", 401), 1002);
        Error(await Send(endpoint, doctorToken, 403), 1003);
        Error(await Send(endpoint, adminToken, 403), 1003);
        Error(await Send(endpoint, missingToken, 403), 1010);
        headDoctor.IsActive = false;
        await db.SaveChangesAsync();
        Error(await Send(endpoint, headToken, 403), 1010);
        headDoctor.IsActive = true;
        var department = await db.Departments.SingleAsync(x => x.DepartmentId == 1);
        department.IsActive = false;
        await db.SaveChangesAsync();
        Error(await Send(endpoint, headToken, 403), 1010);
        department.IsActive = true;
        await db.SaveChangesAsync();
        await db.RolePermissions.Where(x => x.RoleId == headRoleId && x.PermissionCode == PermissionCodes.ReportsDepartmentStatistics).ExecuteDeleteAsync();
        try { Error(await Send(endpoint, headToken, 403), 1003); }
        finally
        {
            db.RolePermissions.Add(new RolePermission { RoleId = headRoleId, PermissionCode = PermissionCodes.ReportsDepartmentStatistics });
            await db.SaveChangesAsync();
        }
        db.RolePermissions.Add(new RolePermission { RoleId = 2, PermissionCode = PermissionCodes.ReportsDepartmentStatistics });
        await db.SaveChangesAsync();
        try { Error(await Send(endpoint, doctorToken, 403), 1003); }
        finally { await db.RolePermissions.Where(x => x.RoleId == 2 && x.PermissionCode == PermissionCodes.ReportsDepartmentStatistics).ExecuteDeleteAsync(); }
        Error(await Send("api/admin-dashboard/summary", headToken, 403), 1003);
        await Send("api/admin-dashboard/summary", adminToken);
        await Send("api/test/doctor", headToken);
        await Send("api/medical-records/queue", headToken);

        foreach (var query in new[] { "?fromDate=2031-05-01", "?toDate=2031-05-31", "?fromDate=&toDate=",
            "?fromDate=bad&toDate=2031-05-31", "?fromDate=2031-02-29&toDate=2031-05-31",
            "?fromDate=2031-5-01&toDate=2031-05-31", "?fromDate=2031-06-01&toDate=2031-05-31",
            "?fromDate=2031-05-01T00:00:00Z&toDate=2031-05-31", "?fromDate=2031-05-01&toDate=9999-12-31" })
            Error(await Send(endpoint + query, headToken, 400), 1001, fields: true);

        var defaultResult = (await Send(endpoint, headToken))["result"]!;
        var today = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Asia/Ho_Chi_Minh");
        var month = new DateOnly(today.Year, today.Month, 1);
        check(defaultResult["fromDate"]!.GetValue<string>() == month.ToString("yyyy-MM-dd")
            && defaultResult["toDate"]!.GetValue<string>() == month.AddMonths(1).AddDays(-1).ToString("yyyy-MM-dd"),
            "A7 defaults to the full current month in Vietnam, independent of server timezone");
        Counts(await Send(endpoint + period, headToken), 0, 0, 0);

        var visitSequence = 0;
        Appointment AddVisit(int doctor, DateTime date, string status = "Completed", bool record = true, int? recordDoctor = null)
        {
            var slotStart = TimeSpan.FromMinutes(8 * 60 + visitSequence++ * 30);
            var appointment = new Appointment { DoctorId = doctor, AppointmentDate = date.Date, Status = status,
                PatientName = "A7 private patient", PatientPhone = "0900000000", Reason = "Private symptoms",
                StartTime = slotStart, EndTime = slotStart.Add(TimeSpan.FromMinutes(30)), CreatedAt = DateTime.UtcNow };
            if (record) appointment.MedicalRecord = new MedicalRecord { DoctorId = recordDoctor ?? doctor,
                ExaminationDate = date, Symptoms = "Private symptoms", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            db.Appointments.Add(appointment);
            return appointment;
        }
        var start = new DateTime(2031, 5, 1);
        var next = new DateTime(2031, 6, 1);
        var first = AddVisit(1, start);
        AddVisit(headDoctor.DoctorId, next.AddTicks(-1));
        AddVisit(1, start.AddDays(15), "InProgress");
        AddVisit(1, start.AddTicks(-1));
        AddVisit(1, next);
        AddVisit(1, start, "Pending");
        AddVisit(1, start, "Confirmed");
        AddVisit(1, start, "Cancelled");
        AddVisit(1, start, record: false);
        AddVisit(2, start);
        AddVisit(2, start, recordDoctor: 1);
        AddVisit(1, start, recordDoctor: 2);
        DoctorScheduleRequest AddRequest(int doctor, DateOnly date, string status)
        {
            var request = new DoctorScheduleRequest { DoctorId = doctor, RoomId = doctor == 2 ? 2 : 1,
                WorkDate = date, StartTime = TimeSpan.FromHours(10), EndTime = TimeSpan.FromHours(11), Status = status,
                CreatedAt = new DateTime(2020, 1, 1), ReviewedAt = status == "Approved" ? new DateTime(2035, 1, 1) : null,
                ReviewerId = status == "Approved" ? adminId : null, RejectReason = status == "Rejected" ? "Unavailable" : null };
            db.DoctorScheduleRequests.Add(request);
            return request;
        }
        var firstDay = DateOnly.FromDateTime(start);
        var lastDay = DateOnly.FromDateTime(next.AddDays(-1));
        AddRequest(1, firstDay, "Pending");
        AddRequest(1, lastDay, "Pending");
        var approved = AddRequest(headDoctor.DoctorId, firstDay, "Approved");
        AddRequest(1, lastDay, "Approved");
        AddRequest(1, firstDay, "Rejected");
        AddRequest(1, firstDay, "Cancelled");
        AddRequest(1, firstDay.AddDays(-1), "Pending");
        AddRequest(1, lastDay.AddDays(1), "Approved");
        AddRequest(2, firstDay, "Pending");
        AddRequest(2, lastDay, "Approved");
        await db.SaveChangesAsync();
        db.DoctorSchedules.Add(new DoctorSchedule { RequestId = approved.RequestId, DoctorId = headDoctor.DoctorId,
            RoomId = 1, WorkDate = approved.WorkDate, StartTime = approved.StartTime, EndTime = approved.EndTime,
            Status = "Approved", MaxPatients = 2, IsActive = true, CreatedAt = DateTime.UtcNow });
        foreach (var stage in new[] { "LabAndConsultation", "Medicine" })
            db.Invoices.Add(new Invoice { AppointmentId = first.AppointmentId, PatientId = doctorId, CashierId = adminId,
                BillingStage = stage, TotalAmount = 20, PatientAmount = 20,
                InvoiceDetails = new() {
                    new() { SourceType = "Appointment", SourceId = first.AppointmentId, ItemName = "Service 1", UnitPrice = 10, Quantity = 1, TotalPrice = 10 },
                    new() { SourceType = "Appointment", SourceId = first.AppointmentId, ItemName = "Service 2", UnitPrice = 10, Quantity = 1, TotalPrice = 10 } } });
        await db.SaveChangesAsync();

        Counts(await Send(endpoint + period, headToken), 3, 2, 2);
        Counts(await Send(endpoint + period + "&departmentId=2&DepartmentId=3", headToken,
            body: new { departmentId = 2 }, tamperHeaders: true), 3, 2, 2);
        var other = (await Send(endpoint + period, otherToken))["result"]!;
        check(other["departmentId"]!.GetValue<int>() == 2 && other["visitCount"]!.GetValue<int>() == 1
            && other["pendingScheduleRequestCount"]!.GetValue<int>() == 1 && other["approvedScheduleRequestCount"]!.GetValue<int>() == 1,
            "A7 department B receives its own independent counts, never department A's data");
        var firstOnly = (await Send(endpoint + "?fromDate=2031-05-01&toDate=2031-05-01", headToken))["result"]!;
        check(firstOnly["visitCount"]!.GetValue<int>() == 1 && firstOnly["pendingScheduleRequestCount"]!.GetValue<int>() == 1,
            "A7 same-day range includes midnight and ignores unrelated appointment statuses");
        check(await new VisitReportQuery(db).CountAsync(1, firstDay, lastDay) == 3,
            "A7 and Thoai's Report integration share one database-backed visit formula");
        try
        {
            await new VisitReportQuery(db).CountAsync(0, firstDay, lastDay);
            check(false, "Visit report must reject an absent department");
        }
        catch (ArgumentOutOfRangeException) { check(true, "Shared visit query requires an explicit positive department"); }

        // This is the isolated random test database created by Program.cs, never a configured application DB.
        check(db.Database.GetDbConnection().Database.StartsWith("ClinicWeek2Test_", StringComparison.Ordinal),
            "Source failure check runs only in the disposable verification database");
        await db.Database.ExecuteSqlRawAsync("EXEC sp_rename N'dbo.MedicalRecords', N'A7UnavailableMedicalRecords';");
        try { Error(await Send(endpoint + period, headToken, 500), 9999); }
        finally { await db.Database.ExecuteSqlRawAsync("EXEC sp_rename N'dbo.A7UnavailableMedicalRecords', N'MedicalRecords';"); }
        Counts(await Send(endpoint + period, headToken), 3, 2, 2);

        var swagger = await Send("swagger/v1/swagger.json", null);
        var operation = swagger["paths"]!["/api/department-head/statistics"]!["get"]!;
        check(operation["x-contract-version"]!.GetValue<string>() == "A7/1.0"
            && operation["x-policy"]!.GetValue<string>() == PermissionCodes.ReportsDepartmentStatistics
            && operation["parameters"]!.AsArray().Select(x => x!["name"]!.GetValue<string>()).ToHashSet().SetEquals(new[] { "fromDate", "toDate" })
            && new[] { "200", "400", "401", "403", "500" }.All(code => operation["responses"]![code] != null),
            "A7 Swagger freezes dates, policy, version and all documented HTTP outcomes");
        return new { username = head.Username, otherUsername = otherHead.Username, fromDate = "2031-05-01", toDate = "2031-05-31" };
    }
}

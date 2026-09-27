using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;

internal static class RbacChecks
{
    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password,
        Action<bool, string> check)
    {
        async Task<JsonNode?> Send(HttpMethod method, string path, object? body = null,
            int status = 200, string? token = null)
        {
            using var request = new HttpRequestMessage(method, path);
            if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status,
                $"RBAC {method} {path}: expected {status}, got {(int)response.StatusCode}"
                + ((int)response.StatusCode == status ? "" : $": {content}"));
            return string.IsNullOrWhiteSpace(content) ? null : JsonNode.Parse(content);
        }
        async Task<JsonNode> Login(string username) =>
            (await Send(HttpMethod.Post, "api/auth/login", new { username, password }))!["result"]!;
        static string Access(JsonNode response) => response["accessToken"]!.GetValue<string>();
        client.DefaultRequestHeaders.Authorization = null;
        var admin = await Login("testadmin");
        var doctor = await Login("testdoctor");
        var adminToken = Access(admin);
        var doctorToken = Access(doctor);
        var doctorUserId = doctor["userId"]!.GetValue<int>();
        await Send(HttpMethod.Get, "api/inventory", token: doctorToken);
        await Send(HttpMethod.Post, "api/inventory", new { }, 403, doctorToken);
        await Send(HttpMethod.Get, "api/medicines", token: doctorToken);
        await Send(HttpMethod.Post, "api/medicines", new { }, 403, doctorToken);
        await Send(HttpMethod.Patch, "api/doctors/2/account", new { userId = doctorUserId },
            403, doctorToken);
        await Send(HttpMethod.Patch, "api/doctors/2/account", new { userId = doctorUserId },
            400, adminToken);
        await Send(HttpMethod.Get, "api/rbac/roles", status: 403, token: doctorToken);
        await Send(HttpMethod.Post, "api/rbac/roles", new { name = "NotAllowed", description = "Should fail" },
            403, doctorToken);

        var catalog = (await Send(HttpMethod.Get, "api/rbac/permissions", token: adminToken))!["result"]!.AsArray();
        check(catalog.Any(x => x!["code"]!.GetValue<string>() == "billing.recordPayment"
            && !x["isImplemented"]!.GetValue<bool>()), "Billing permission is documented as pending API work");
        var cashier = (await Send(HttpMethod.Post, "api/rbac/roles", new
        {
            name = "Cashier", description = "Thu ngân", permissionCodes = new[] { "billing.view", "billing.recordPayment" }
        }, 201, adminToken))!["result"]!;
        var cashierId = cashier["roleId"]!.GetValue<int>();
        check(!cashier["isSystem"]!.GetValue<bool>() && cashier["permissionCodes"]!.AsArray().Count == 2,
            "Cashier persists as a custom role with separate billing rights");
        await Send(HttpMethod.Post, "api/rbac/roles", new { name = "cashier", description = "Duplicate" },
            409, adminToken);
        await Send(HttpMethod.Post, "api/rbac/roles", new
        {
            name = "AccountManager", description = "Forbidden account rights",
            permissionCodes = new[] { "accounts.manageRoles" }
        }, 400, adminToken);
        var copied = (await Send(HttpMethod.Post, "api/rbac/roles", new
        {
            name = "AdminCopy", description = "Copied clinical rights", copyFromRoleId = 1
        }, 201, adminToken))!["result"]!;
        check(!copied["permissionCodes"]!.AsArray().Any(x => x!.GetValue<string>().StartsWith("accounts.")),
            "Copying Admin does not grant account management to a custom role");
        await Send(HttpMethod.Delete, $"api/rbac/roles/{copied["roleId"]!.GetValue<int>()}",
            new { version = copied["version"]!.GetValue<string>() }, 204, adminToken);

        var reader = (await Send(HttpMethod.Post, "api/rbac/roles", new
        {
            name = "LabReader", description = "Read lab catalog", permissionCodes = new[] { "labs.viewTypes" }
        }, 201, adminToken))!["result"]!;
        var readerId = reader["roleId"]!.GetValue<int>();
        var readerVersion = reader["version"]!.GetValue<string>();
        var accountId = await db.Users.Where(x => x.Username == "accesspatient").Select(x => x.UserId).SingleAsync();
        await Send(HttpMethod.Patch, $"api/users/{accountId}/role", new { roleId = readerId }, token: adminToken);
        await Send(HttpMethod.Delete, $"api/rbac/roles/{readerId}", new { version = readerVersion }, 409, adminToken);
        var readerSession = await Login("accesspatient");
        check(readerSession["role"]!.GetValue<string>() == "LabReader", "Custom RoleId appears in JWT session");
        await Send(HttpMethod.Get, "api/LabTestTypes", token: Access(readerSession));
        await Send(HttpMethod.Get, "api/medical-records/1", status: 403, token: Access(readerSession));
        await Send(HttpMethod.Get, "api/rbac/roles", status: 403, token: Access(readerSession));
        var edited = (await Send(HttpMethod.Put, $"api/rbac/roles/{readerId}/permissions",
            new { version = readerVersion, permissionCodes = Array.Empty<string>() }, token: adminToken))!["result"]!;
        await Send(HttpMethod.Get, "api/LabTestTypes", status: 401, token: Access(readerSession));
        await Send(HttpMethod.Put, $"api/rbac/roles/{readerId}/permissions",
            new { version = readerVersion, permissionCodes = new[] { "labs.viewTypes" } }, 409, adminToken);
        readerSession = await Login("accesspatient");
        await Send(HttpMethod.Get, "api/LabTestTypes", status: 403, token: Access(readerSession));
        await Send(HttpMethod.Patch, $"api/users/{accountId}/role", new { roleId = cashierId }, token: adminToken);
        var cashierSession = await Login("accesspatient");
        await Send(HttpMethod.Get, "api/medical-records/1", status: 403, token: Access(cashierSession));
        await Send(HttpMethod.Get, "api/LabTestTypes", status: 403, token: Access(cashierSession));
        check(cashierSession["permissions"]!.AsArray().Count == 2, "Cashier login returns current billing rights");

        var adminRole = (await Send(HttpMethod.Get, "api/rbac/roles/1", token: adminToken))!["result"]!;
        var requiredRights = adminRole["permissionCodes"]!.AsArray().Select(x => x!.GetValue<string>())
            .Where(x => x != "accounts.manageRoles").ToArray();
        await Send(HttpMethod.Put, "api/rbac/roles/1/permissions",
            new { version = adminRole["version"]!.GetValue<string>(), permissionCodes = requiredRights },
            409, adminToken);
        await Send(HttpMethod.Put, "api/rbac/roles/1",
            new { name = "Admin2", description = "Forbidden", version = adminRole["version"]!.GetValue<string>() },
            409, adminToken);
        await Send(HttpMethod.Put, "api/rbac/roles/5/permissions",
            new { version = (await Send(HttpMethod.Get, "api/rbac/roles/5", token: adminToken))!["result"]!["version"]!.GetValue<string>(),
                permissionCodes = new[] { "clinical.editDiagnosis" } }, 400, adminToken);
        await Send(HttpMethod.Patch, $"api/users/{admin["userId"]!.GetValue<int>()}/role",
            new { roleId = cashierId }, 409, adminToken);

        var audit = (await Send(HttpMethod.Get, "api/rbac/audit?pageSize=100", token: adminToken))!["result"]!;
        check(audit["items"]!.AsArray().Any(x => x!["action"]!.GetValue<string>() == "role.permissions")
            && audit["items"]!.AsArray().Any(x => x!["action"]!.GetValue<string>() == "user.role"),
            "RBAC audit records both permission and account role changes");

        // A doctor can read the record attached to their linked Doctor row, not another doctor's record.
        var ownRecord = await db.MedicalRecords.AsNoTracking().Where(x => x.DoctorId == 1)
            .Select(x => x.MedicalRecordId).FirstAsync();
        await Send(HttpMethod.Get, $"api/medical-records/{ownRecord}", token: doctorToken);
        var otherAppointment = new Appointment
        {
            DoctorId = 2, PatientName = "Scope test", PatientPhone = "0900000000",
            AppointmentDate = DateTime.Today, StartTime = new TimeSpan(17, 0, 0),
            EndTime = new TimeSpan(17, 30, 0), Reason = "Scope test", Status = "InProgress",
            CreatedAt = DateTime.UtcNow
        };
        db.Appointments.Add(otherAppointment);
        await db.SaveChangesAsync();
        await Send(HttpMethod.Patch, $"api/appointments/{otherAppointment.AppointmentId}/start-examination",
            status: 403, token: doctorToken);
        db.MedicalRecords.Add(new MedicalRecord
        {
            AppointmentId = otherAppointment.AppointmentId, DoctorId = 2,
            ExaminationDate = DateTime.Today, Symptoms = "Scope test", CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        var otherRecord = await db.MedicalRecords.Where(x => x.AppointmentId == otherAppointment.AppointmentId)
            .Select(x => x.MedicalRecordId).SingleAsync();
        await Send(HttpMethod.Get, $"api/medical-records/{otherRecord}", status: 403, token: doctorToken);
        await Send(HttpMethod.Get, $"api/medical-records/{otherRecord}", token: adminToken);

        await Send(HttpMethod.Patch, $"api/users/{accountId}/role", new { roleId = 4 }, token: adminToken);
        await Send(HttpMethod.Delete, $"api/rbac/roles/{readerId}",
            new { version = edited["version"]!.GetValue<string>() }, 204, adminToken);
    }
}

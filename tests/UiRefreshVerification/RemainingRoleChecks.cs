using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore;

internal record RemainingRoleMetadata(int CashierUserId, int CashierRoleId,
    int PendingLabId, int HeadPendingLabId, int OfflineLabId);

internal static class RemainingRoleChecks
{
    public static async Task<RemainingRoleMetadata> RunAsync(HttpClient http, ApplicationDbContext db,
        string password, string admin, string doctor, string head, string lab, string patient, string other,
        string foreignDoctor, Action<bool, string> check)
    {
        async Task<JsonNode?> Api(HttpMethod method, string path, object? payload = null, string? access = null, int expected = 200)
        {
            using var request = new HttpRequestMessage(method, "api/" + path);
            if (access != null) request.Headers.Authorization = new("Bearer", access);
            if (payload != null) request.Content = JsonContent.Create(payload);
            using var response = await http.SendAsync(request);
            if ((int)response.StatusCode != expected)
                throw new InvalidOperationException($"Remaining-role check {method} {path}: expected {expected}, got {(int)response.StatusCode}.");
            if (expected is not (200 or 201)) return null;
            var parsed = JsonNode.Parse(await response.Content.ReadAsStringAsync());
            return parsed is JsonObject envelope && envelope.ContainsKey("result") && envelope.ContainsKey("code") ? envelope["result"] : parsed;
        }
        var cashierRole = await db.Roles.SingleAsync(x => x.RoleName == RoleConstants.Cashier);
        var billingRights = new[] { PermissionCodes.BillingView, PermissionCodes.BillingCreate, PermissionCodes.BillingRecordPayment };
        check(cashierRole.IsSystem && await db.RolePermissions.CountAsync(x => x.RoleId == cashierRole.RoleId) == 3,
            "Fresh migration provisions the Cashier system role and three billing permissions");
        // Simulate an older installation with an occupied seed ID and a manually created Cashier.
        await db.Database.ExecuteSqlRawAsync("DELETE FROM dbo.RolePermissions WHERE RoleId=8; UPDATE dbo.Roles SET RoleName=N'ExistingCustomRole', IsSystem=0 WHERE RoleId=8; INSERT INTO dbo.Roles (RoleName, Description, IsSystem) VALUES (N'Cashier', N'Existing cashier', 0);");
        db.ChangeTracker.Clear();
        var existingRoleId = await db.Roles.Where(x => x.RoleName == RoleConstants.Cashier).Select(x => x.RoleId).SingleAsync();
        db.RolePermissions.Add(new() { RoleId = existingRoleId, PermissionCode = PermissionCodes.PharmacyViewInventory });
        await db.SaveChangesAsync();
        using (var stream = typeof(ApplicationDbContext).Assembly.GetManifestResourceStream("ClinicManagement.Data.Seed.20261109-cashier-role.sql")!)
        using (var reader = new StreamReader(stream))
        {
            var sql = await reader.ReadToEndAsync();
            await db.Database.ExecuteSqlRawAsync(sql);
            await db.Database.ExecuteSqlRawAsync(sql);
        }
        cashierRole = await db.Roles.SingleAsync(x => x.RoleName == RoleConstants.Cashier);
        check(cashierRole.RoleId == existingRoleId && cashierRole.IsSystem
            && await db.Roles.AnyAsync(x => x.RoleId == 8 && x.RoleName == "ExistingCustomRole")
            && await db.RolePermissions.CountAsync(x => x.RoleId == existingRoleId) == 4,
            "Cashier upgrade is idempotent and preserves a manually provisioned role and occupied IDs");
        await Api(HttpMethod.Delete, $"rbac/roles/{cashierRole.RoleId}", new { version = Convert.ToBase64String(cashierRole.Version) }, admin, 409);
        var cashierUser = (await Api(HttpMethod.Post, "users", new { username = "uicashier", password,
            fullName = "Thu ngân kiểm thử", roleId = cashierRole.RoleId }, admin, 201))!;
        var cashierId = cashierUser["userId"]!.GetValue<int>();
        var cashierSession = (await Api(HttpMethod.Post, "auth/login", new { username = "uicashier", password }))!;
        var cashier = cashierSession["accessToken"]!.GetValue<string>();
        check(cashierSession["role"]!.GetValue<string>() == RoleConstants.Cashier
            && billingRights.All(code => cashierSession["permissions"]!.AsArray().Any(x => x!.GetValue<string>() == code)),
            "Admin-created Cashier can log in with its actual default billing rights");
        await Api(HttpMethod.Get, "invoices/pending", expected: 401);
        await Api(HttpMethod.Get, "invoices/history", access: patient, expected: 403);
        await Api(HttpMethod.Get, "invoices/pending", access: cashier);
        await Api(HttpMethod.Get, "invoices/history", access: cashier);
        foreach (var path in new[] { "users", "LabTests", "schedule-requests" })
            await Api(HttpMethod.Get, path, access: cashier, expected: 403);
        check(true, "Cashier reads billing APIs and cannot read accounts, clinical labs or schedule reviews");
        foreach (var code in billingRights)
        {
            var grant = await db.RolePermissions.SingleAsync(x => x.RoleId == cashierRole.RoleId && x.PermissionCode == code);
            db.RolePermissions.Remove(grant); await db.SaveChangesAsync();
            try
            {
                if (code == PermissionCodes.BillingView)
                    await Api(HttpMethod.Get, "invoices/pending", access: cashier, expected: 403);
                else
                {
                    await Api(HttpMethod.Get, "invoices/history", access: cashier);
                    await Api(HttpMethod.Post, "invoices", new { }, cashier, 403);
                    await Api(HttpMethod.Post, "invoices/adjustment", new { }, cashier, 403);
                }
            }
            finally
            {
                db.RolePermissions.Add(new() { RoleId = cashierRole.RoleId, PermissionCode = code });
                await db.SaveChangesAsync();
            }
        }
        check(true, "Billing API enforces view rights and both create/payment rights on paid mutations");

        var patientId = await db.Users.Where(x => x.Username == "uipatient").Select(x => x.UserId).SingleAsync();
        var otherId = await db.Users.Where(x => x.Username == "uiother").Select(x => x.UserId).SingleAsync();
        var doctorId = await db.Users.Where(x => x.Username == "uidoctor").Select(x => x.UserId).SingleAsync();
        var headId = await db.Users.Where(x => x.Username == "uihead").Select(x => x.UserId).SingleAsync();
        var labTypeId = await db.LabTestTypes.Where(x => x.IsActive).Select(x => x.Id).FirstAsync();
        async Task<int> Order(string access, int owner) => (await Api(HttpMethod.Post, "LabTests",
            new { patientId = owner, labTestTypeId = labTypeId, clinicalDiagnosis = "Theo dõi kết quả kiểm thử" }, access))!["id"]!.GetValue<int>();
        object Result(int id, string text = "Kết quả kiểm thử vai trò") => new { labTestId = id, resultSummary = text, note = "Đã đối chiếu" };
        await using var doctorLive = await SignalRProbe.ConnectAsync(http.BaseAddress!, doctor);
        await using var headLive = await SignalRProbe.ConnectAsync(http.BaseAddress!, head);
        await using var patientLive = await SignalRProbe.ConnectAsync(http.BaseAddress!, patient);
        await using var otherLive = await SignalRProbe.ConnectAsync(http.BaseAddress!, other);
        await using var foreignLive = await SignalRProbe.ConnectAsync(http.BaseAddress!, foreignDoctor);
        await using var labLive = await SignalRProbe.ConnectAsync(http.BaseAddress!, lab);
        await using var cashierLive = await SignalRProbe.ConnectAsync(http.BaseAddress!, cashier);
        var orderId = await Order(doctor, patientId);
        await Api(HttpMethod.Post, "LabTests/results", Result(orderId), patient, 403);
        await Api(HttpMethod.Post, "LabTests/results", Result(orderId), lab);
        await doctorLive.WaitCountAsync(1, "LabResultChanged");
        await patientLive.WaitCountAsync(1, "LabResultChanged");
        var key = $"lab-result:{orderId}:Completed";
        var recipients = await db.Notifications.Where(x => x.EventKey == key).Select(x => x.UserId).ToListAsync();
        check(recipients.Count == 2 && recipients.Contains(patientId) && recipients.Contains(doctorId),
            "Result completion persists notifications for the owning Patient and ordering Doctor account IDs");
        check(headLive.Count("LabResultChanged") == 0 && otherLive.Count("LabResultChanged") == 0
            && foreignLive.Count("LabResultChanged") == 0 && labLive.Count("LabResultChanged") == 0
            && cashierLive.Count("LabResultChanged") == 0,
            "Lab result events exclude other patients, unrelated doctors, heads, technicians and Cashier");
        var eventData = patientLive.Events.Single(x => x.Name == "LabResultChanged").Payload;
        check(eventData.AsObject().Count == 1 && eventData["labTestId"]!.GetValue<int>() == orderId,
            "Realtime invalidation contains only the lab ID and no clinical result content");
        var history = (await Api(HttpMethod.Get, "notifications?pageSize=100", access: patient))!;
        var notification = history["items"]!.AsArray().Single(x => x!["labTestId"]?.GetValue<int>() == orderId)!;
        var notificationId = notification["notificationId"]!.GetValue<int>();
        check(notification["type"]!.GetValue<string>() == "LabResult"
            && !notification["message"]!.GetValue<string>().Contains("Kết quả kiểm thử vai trò"),
            "Persisted notification history supports opening results without exposing the clinical summary");
        await Api(HttpMethod.Patch, $"notifications/{notificationId}/read", access: other, expected: 403);
        await Api(HttpMethod.Patch, $"notifications/{notificationId}/read", access: patient);
        check(await db.Notifications.AnyAsync(x => x.NotificationId == notificationId && x.IsRead),
            "Only the notification owner can mark a result notification as read");
        await Api(HttpMethod.Post, "LabTests/results", Result(orderId), lab, 409);
        check(await db.Notifications.CountAsync(x => x.EventKey == key) == 2
            && await db.LabTestResults.CountAsync(x => x.LabTestId == orderId) == 1,
            "Duplicate result submission creates no extra result or notifications");

        var headOrder = await Order(head, otherId);
        await Api(HttpMethod.Post, "LabTests/results", Result(headOrder), lab);
        await headLive.WaitCountAsync(1, "LabResultChanged");
        await otherLive.WaitCountAsync(1, "LabResultChanged");
        check(await db.Notifications.CountAsync(x => x.EventKey == $"lab-result:{headOrder}:Completed"
                && (x.UserId == headId || x.UserId == otherId)) == 2 && doctorLive.Count("LabResultChanged") == 1,
            "DepartmentHead receives its own doctor's result and only the correct Patient is notified");

        var raceOrder = await Order(doctor, patientId);
        async Task<int> SubmitRace()
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "api/LabTests/results") { Content = JsonContent.Create(Result(raceOrder)) };
            request.Headers.Authorization = new("Bearer", lab);
            using var response = await http.SendAsync(request);
            return (int)response.StatusCode;
        }
        var race = await Task.WhenAll(SubmitRace(), SubmitRace());
        check(race.Count(x => x == 200) == 1 && race.Count(x => x == 409) == 1
            && await db.LabTestResults.CountAsync(x => x.LabTestId == raceOrder) == 1
            && await db.Notifications.CountAsync(x => x.EventKey == $"lab-result:{raceOrder}:Completed") == 2,
            $"Concurrent completion commits exactly one result and one notification per recipient (statuses {string.Join(',', race)})");

        var rollbackOrder = await Order(doctor, patientId);
        await db.Database.ExecuteSqlRawAsync("CREATE TRIGGER dbo.TestRejectLabNotification ON dbo.Notifications AFTER INSERT AS BEGIN IF EXISTS (SELECT 1 FROM inserted WHERE Type=N'LabResult') THROW 51001, 'Fixture notification failure', 1; END");
        try { await Api(HttpMethod.Post, "LabTests/results", Result(rollbackOrder), lab, 500); }
        finally { await db.Database.ExecuteSqlRawAsync("DROP TRIGGER dbo.TestRejectLabNotification"); }
        check(await db.LabTests.AnyAsync(x => x.Id == rollbackOrder && x.Status == "Pending")
            && !await db.LabTestResults.AnyAsync(x => x.LabTestId == rollbackOrder)
            && !await db.Notifications.AnyAsync(x => x.EventKey == $"lab-result:{rollbackOrder}:Completed"),
            "Notification persistence failure rolls back the result and Completed status atomically");
        await Api(HttpMethod.Post, "LabTests/results", Result(rollbackOrder), lab);
        var silentOrder = await Order(doctor, patientId);
        var grants = await db.RolePermissions.Where(x =>
            x.Role.RoleName == RoleConstants.Patient && x.PermissionCode == PermissionCodes.LabsViewOwnResult
            || x.Role.RoleName == RoleConstants.Doctor && x.PermissionCode == PermissionCodes.LabsOrder).ToListAsync();
        db.RolePermissions.RemoveRange(grants); await db.SaveChangesAsync();
        try { await Api(HttpMethod.Post, "LabTests/results", Result(silentOrder), lab); }
        finally
        {
            db.RolePermissions.AddRange(grants.Select(x => new ClinicManagement.Data.Entities.RolePermission
                { RoleId = x.RoleId, PermissionCode = x.PermissionCode }));
            await db.SaveChangesAsync();
        }
        check(await db.LabTests.AnyAsync(x => x.Id == silentOrder && x.Status == "Completed")
            && !await db.Notifications.AnyAsync(x => x.EventKey == $"lab-result:{silentOrder}:Completed"),
            "No eligible recipients does not block completion and revoked read rights receive no notifications");
        check(await db.Notifications.AnyAsync(x => x.UserId == patientId && x.EventKey.StartsWith("appointment:")),
            "Appointment changes already persist history for the Patient in the current workflow");

        return new(cashierId, cashierRole.RoleId, await Order(doctor, patientId),
            await Order(head, otherId), await Order(doctor, patientId));
    }
}

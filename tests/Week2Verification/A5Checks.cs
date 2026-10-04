using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json.Nodes;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ClinicManagement.Migrations;
using ClinicManagement.Commons;

internal static class A5Checks
{
    public static async Task VerifyNotificationMigrationAsync(ApplicationDbContext db, Action<bool, string> check)
    {
        var generator = db.GetService<IMigrationsSqlGenerator>();
        var migration = new AddPersistentNotifications();
        foreach (var command in generator.Generate(migration.DownOperations, db.Model))
            await db.Database.ExecuteSqlRawAsync(command.CommandText);
        foreach (var command in generator.Generate(migration.UpOperations, db.Model))
            await db.Database.ExecuteSqlRawAsync(command.CommandText);
        check(await db.Notifications.CountAsync() == 0 && await db.PatientBooks.CountAsync() == 0,
            "A5 Notifications migration upgrades and rolls back cleanly on current baseline schema");
    }
    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password, Action<bool, string> check)
    {
        async Task<JsonNode?> Send(HttpMethod method, string path, string? token = null, object? body = null, int status = 200)
        {
            using var request = new HttpRequestMessage(method, path);
            if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status, $"A5 {method} {path}: expected {status}, got {(int)response.StatusCode}"
                + ((int)response.StatusCode == status ? "" : $" {text}"));
            return string.IsNullOrWhiteSpace(text) ? null : JsonNode.Parse(text);
        }
        async Task<string> Login(string name) => (await Send(HttpMethod.Post, "api/auth/login", body: new { username = name, password }))!["result"]!["accessToken"]!.GetValue<string>();
        // DepartmentHead is seeded by the legacy review migration rather than the EF model.
        var headRole = new Role { RoleName = RoleConstants.DepartmentHead, Description = "Department head", IsSystem = true };
        db.Roles.Add(headRole);
        await db.SaveChangesAsync();
        db.RolePermissions.AddRange(PermissionCatalog.DefaultRoles[RoleConstants.DepartmentHead]
            .Select(code => new RolePermission { RoleId = headRole.RoleId, PermissionCode = code }));
        await db.SaveChangesAsync();
        var roleId = headRole.RoleId;
        var heads = new[] { "a5head", "a5otherhead" }.Select(name => new User
        {
            Username = name, FullName = name, RoleId = roleId, PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), CreatedAt = DateTime.UtcNow
        }).ToArray();
        db.Users.AddRange(heads);
        await db.SaveChangesAsync();
        var headDoctor = new Doctor { UserId = heads[0].UserId, FullName = "A5 head", Title = "BS", DepartmentId = 1, SpecializationId = 1 };
        db.Doctors.AddRange(headDoctor, new Doctor { UserId = heads[1].UserId, FullName = "A5 other head", Title = "BS", DepartmentId = 2, SpecializationId = 2 });
        await db.SaveChangesAsync();
        var headToken = await Login("a5head");
        var otherToken = await Login("a5otherhead");
        var doctorToken = await Login("testdoctor");
        var receptionToken = await Login("testreceptionist");
        var adminToken = await Login("testadmin");
        var labToken = await Login("testlab");
        var doctorUser = await db.Users.SingleAsync(x => x.Username == "testdoctor");
        var receptionUser = await db.Users.SingleAsync(x => x.Username == "testreceptionist");
        await using var headLive = await LiveNotifications.ConnectAsync(client.BaseAddress!, headToken);
        await using var otherLive = await LiveNotifications.ConnectAsync(client.BaseAddress!, otherToken);
        await using var doctorLive = await LiveNotifications.ConnectAsync(client.BaseAddress!, doctorToken);
        await using var receptionLive = await LiveNotifications.ConnectAsync(client.BaseAddress!, receptionToken);
        await using var adminLive = await LiveNotifications.ConnectAsync(client.BaseAddress!, adminToken);
        await using var labLive = await LiveNotifications.ConnectAsync(client.BaseAddress!, labToken);

        var date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(70));
        DoctorSchedule Schedule(int doctor, int room, string status, bool active = true) => new()
        {
            DoctorId = doctor, RoomId = room, WorkDate = date, StartTime = TimeSpan.FromHours(10),
            EndTime = TimeSpan.FromHours(11), MaxPatients = 2, Status = status, IsActive = active, CreatedAt = DateTime.UtcNow
        };
        var published = Schedule(1, 1, "Approved");
        db.DoctorSchedules.AddRange(published, Schedule(1, 1, "Pending"), Schedule(1, 1, "Rejected"),
            Schedule(1, 1, "Approved", false), Schedule(2, 2, "Approved"), Schedule(1, 2, "Approved"));
        await db.SaveChangesAsync();
        var dayPath = $"api/doctor-schedules/department?date={date:yyyy-MM-dd}";
        await Send(HttpMethod.Get, dayPath, status: 401);
        await Send(HttpMethod.Get, dayPath, doctorToken, status: 403);
        await Send(HttpMethod.Get, dayPath, receptionToken, status: 403);
        await Send(HttpMethod.Get, dayPath, adminToken, status: 403);
        await Send(HttpMethod.Get, "api/doctor-schedules/department/options", doctorToken, status: 403);
        await Send(HttpMethod.Get, dayPath + "&doctorId=2", headToken, status: 403);
        await Send(HttpMethod.Get, dayPath + "&roomId=2", headToken, status: 403);
        await Send(HttpMethod.Get, "api/doctor-schedules/department", headToken, status: 400);
        await Send(HttpMethod.Get, dayPath + $"&weekStart={date:yyyy-MM-dd}", headToken, status: 400);
        var day = (await Send(HttpMethod.Get, dayPath + "&departmentId=2", headToken))!["result"]!.AsArray();
        check(day.Count == 1 && day[0]!["scheduleId"]!.GetValue<Guid>() == published.ScheduleId,
            "Day ignores client DepartmentId and excludes Pending/Rejected/inactive/foreign doctor and room");
        var options = (await Send(HttpMethod.Get, "api/doctor-schedules/department/options", headToken))!["result"]!;
        check(options["departmentId"]!.GetValue<int>() == 1 && options["rooms"]!.AsArray().All(x => x!["id"]!.GetValue<int>() == 1)
            && !options["doctors"]!.AsArray().Any(x => x!["id"]!.GetValue<int>() == 2), "Filter options belong only to authenticated head's department");

        var submitted = (await Send(HttpMethod.Post, "api/doctor-schedules/request", doctorToken,
            new { roomId = 1, workDate = date.ToString("yyyy-MM-dd"), startTime = "08:00", endTime = "09:00" }))!["result"]!;
        var requestId = submitted["requestId"]!.GetValue<int>();
        check((await Send(HttpMethod.Get, dayPath, headToken))!["result"]!.AsArray().Count == 1, "Pending request never enters department calendar");
        await headLive.WaitCountAsync(1);
        check(headLive.Messages.Count == 1 && otherLive.Messages.IsEmpty && adminLive.Messages.IsEmpty,
            "Submission notifies exactly the head in the doctor's department");
        await Send(HttpMethod.Post, $"api/schedule-requests/{requestId}/approve", headToken);
        await Send(HttpMethod.Post, $"api/schedule-requests/{requestId}/approve", headToken, status: 409);
        await doctorLive.WaitCountAsync(1);
        check(doctorLive.Messages.Count == 1 && await db.Notifications.CountAsync(x => x.UserId == doctorUser.UserId) == 1,
            "Approval retry produces one persisted notification and one live notification for the doctor");
        var week = (await Send(HttpMethod.Get, $"api/doctor-schedules/department?weekStart={date:yyyy-MM-dd}&doctorId=1&roomId=1", headToken))!["result"]!.AsArray();
        check(week.Count == 2 && week[0]!["startTime"]!.GetValue<string>().StartsWith("08:00")
            && week[1]!["startTime"]!.GetValue<string>().StartsWith("10:00"), "Week shows all approved shifts ordered by WorkDate and start time");

        var rejection = (await Send(HttpMethod.Post, "api/doctor-schedules/request", doctorToken,
            new { roomId = 1, workDate = date.AddDays(1).ToString("yyyy-MM-dd"), startTime = "08:00", endTime = "09:00" }))!["result"]!["requestId"]!.GetValue<int>();
        await Send(HttpMethod.Post, $"api/schedule-requests/{rejection}/reject", headToken, new { rejectReason = "Phòng bảo trì" });
        await Send(HttpMethod.Post, $"api/schedule-requests/{rejection}/reject", headToken, new { rejectReason = "Phòng bảo trì" }, 409);
        await doctorLive.WaitCountAsync(2);
        check(doctorLive.Messages.Last()["message"]!.GetValue<string>().Contains("Phòng bảo trì")
            && await db.Notifications.CountAsync(x => x.UserId == doctorUser.UserId) == 2,
            "Rejection delivers reason once and persists it for the doctor");

        var headRequest = (await Send(HttpMethod.Post, "api/doctor-schedules/request", headToken,
            new { roomId = 1, workDate = date.AddDays(2).ToString("yyyy-MM-dd"), startTime = "08:00", endTime = "09:00" }))!["result"]!["requestId"]!.GetValue<int>();
        await adminLive.WaitCountAsync(1);
        check(adminLive.Messages.Count == 1, "A head's submitted request goes to Admin");
        await Send(HttpMethod.Post, $"api/schedule-requests/{headRequest}/approve", adminToken);
        await headLive.WaitCountAsync(3);

        var patient = new Patient { FullName = "A5 patient", Phone = "0900000055", CreatedAt = DateTime.UtcNow };
        db.Patients.Add(patient);
        await db.SaveChangesAsync();
        var unpaid = (await Send(HttpMethod.Post, $"api/patients/{patient.PatientId}/book-invoices", receptionToken, new { amount = 10000 }))!["result"]!["bookInvoiceId"]!.GetValue<int>();
        check(!await db.Notifications.AnyAsync(x => x.Type == "Billing"), "Creating an Unpaid book invoice produces no Paid notification");
        await Send(HttpMethod.Patch, $"api/book-invoices/{unpaid}/pay", receptionToken);
        await Send(HttpMethod.Patch, $"api/book-invoices/{unpaid}/pay", receptionToken, status: 409);
        await receptionLive.WaitCountAsync(1);
        check(receptionLive.Messages.Count == 1 && await db.Notifications.CountAsync(x => x.Type == "Billing" && x.UserId == receptionUser.UserId) == 1,
            "Book Unpaid to Paid notifies Receptionist exactly once on retry");

        object Invoice(string stage, int source) => new { appointmentId = 0, patientId = patient.PatientId, billingStage = stage,
            paymentMethod = "Cash", items = new[] { new { sourceType = "Book", sourceId = source, itemName = "A5 invoice", quantity = 1, unitPrice = 10000 } } };
        await Send(HttpMethod.Post, "api/Invoices", adminToken, Invoice("Final", 9001));
        check(await db.Notifications.CountAsync(x => x.Type == "Billing") == 1, "A non-Book Paid invoice never creates a book notification");
        await Send(HttpMethod.Post, "api/Invoices", adminToken, Invoice("Book", 9002));
        await Send(HttpMethod.Post, "api/Invoices", adminToken, Invoice("Book", 9002), 400);
        await receptionLive.WaitCountAsync(2);
        check(await db.Notifications.CountAsync(x => x.Type == "Billing") == 2 && receptionLive.Messages.Count == 2,
            "Generic Invoice Book first saved as Paid also notifies once; duplicate source is rejected");

        var book = (await Send(HttpMethod.Post, $"api/book-invoices/{unpaid}/issue-book", receptionToken,
            new { bookNumber = "A5-BOOK-001" }))!["result"]!["patientBookId"]!.GetValue<int>();
        var today = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Asia/Ho_Chi_Minh").Date;
        var appointment = new Appointment { DoctorId = 1, PatientProfileId = patient.PatientId, PatientName = patient.FullName,
            PatientPhone = patient.Phone, AppointmentDate = today, StartTime = TimeSpan.FromHours(15), EndTime = TimeSpan.FromHours(15.5),
            Reason = "A5 check-in", Status = "Confirmed", CreatedAt = DateTime.UtcNow };
        db.Appointments.Add(appointment);
        await db.SaveChangesAsync();
        var checkIn = new { patientProfileId = patient.PatientId, patientBookId = book, bookPresented = false };
        await Send(HttpMethod.Patch, $"api/appointments/{appointment.AppointmentId}/check-in", receptionToken, new { patientProfileId = patient.PatientId, patientBookId = 999999 }, 404);
        check(!await db.Notifications.AnyAsync(x => x.Type == "Appointment"), "Failed check-in emits no notification");
        await Send(HttpMethod.Patch, $"api/appointments/{appointment.AppointmentId}/check-in", receptionToken, checkIn);
        await Send(HttpMethod.Patch, $"api/appointments/{appointment.AppointmentId}/check-in", receptionToken, checkIn, 400);
        await doctorLive.WaitCountAsync(3);
        check(await db.Notifications.CountAsync(x => x.Type == "Appointment" && x.UserId == doctorUser.UserId) == 1
            && doctorLive.Messages.Count == 3, "Check-in delivers exactly once to the assigned doctor");
        check(otherLive.Messages.IsEmpty && labLive.Messages.IsEmpty && await db.Notifications.CountAsync(x => x.UserId == heads[1].UserId) == 0,
            "Other departments and unrelated roles receive neither live nor persisted notifications");
        var history = (await Send(HttpMethod.Get, "api/notifications?pageNumber=1&pageSize=100&userId=" + heads[0].UserId, doctorToken))!["result"]!;
        check(history["totalItems"]!.GetValue<int>() == 3, "History is authenticated-user scoped and retains offline notifications");
        var notificationId = history["items"]![0]!["notificationId"]!.GetValue<int>();
        await Send(HttpMethod.Patch, $"api/notifications/{notificationId}/read", otherToken, status: 403);
        await Send(HttpMethod.Patch, $"api/notifications/{notificationId}/read", doctorToken);
        await Send(HttpMethod.Patch, $"api/notifications/{notificationId}/read", doctorToken);
        await Send(HttpMethod.Get, "api/notifications", status: 401);
        var reopened = (await Send(HttpMethod.Get, "api/notifications?pageSize=100", await Login("testdoctor")))!["result"]!;
        check(reopened["totalItems"]!.GetValue<int>() == 3 && reopened["items"]![0]!["isRead"]!.GetValue<bool>(),
            "Reopening a session reloads persisted history and read state");

        var permission = await db.RolePermissions.SingleAsync(x => x.RoleId == doctorUser.RoleId && x.PermissionCode == PermissionCodes.ClinicalViewAssigned);
        db.RolePermissions.Remove(permission);
        await db.SaveChangesAsync();
        var restrictedAppointment = new Appointment { DoctorId = 1, PatientProfileId = patient.PatientId,
            PatientName = patient.FullName, PatientPhone = patient.Phone, AppointmentDate = today,
            StartTime = TimeSpan.FromHours(16), EndTime = TimeSpan.FromHours(16.5), Reason = "A5 revoked recipient", Status = "Confirmed", CreatedAt = DateTime.UtcNow };
        db.Appointments.Add(restrictedAppointment);
        await db.SaveChangesAsync();
        await Send(HttpMethod.Patch, $"api/appointments/{restrictedAppointment.AppointmentId}/check-in", receptionToken, checkIn);
        await Task.Delay(200);
        check(doctorLive.Messages.Count == 3 && await db.Notifications.CountAsync(x => x.UserId == doctorUser.UserId) == 3,
            "A doctor whose clinical permission was revoked receives no live or persisted check-in notification");
        db.RolePermissions.Add(new RolePermission { RoleId = doctorUser.RoleId, PermissionCode = PermissionCodes.ClinicalViewAssigned });
        await db.SaveChangesAsync();
    }

    private sealed class LiveNotifications : IAsyncDisposable
    {
        private readonly ClientWebSocket socket = new();
        private readonly CancellationTokenSource stop = new();
        private Task pump = Task.CompletedTask;
        public ConcurrentQueue<JsonNode> Messages { get; } = new();
        public static async Task<LiveNotifications> ConnectAsync(Uri baseUrl, string token)
        {
            var live = new LiveNotifications();
            var uri = new UriBuilder(baseUrl) { Scheme = "ws", Path = "/hubs/notification", Query = "access_token=" + token }.Uri;
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            await live.socket.ConnectAsync(uri, timeout.Token);
            await live.socket.SendAsync(Encoding.UTF8.GetBytes("{\"protocol\":\"json\",\"version\":1}\u001e"), WebSocketMessageType.Text, true, timeout.Token);
            var buffer = new byte[4096];
            var handshake = await live.socket.ReceiveAsync(buffer, timeout.Token);
            if (!Encoding.UTF8.GetString(buffer, 0, handshake.Count).StartsWith("{}")) throw new Exception("SignalR handshake failed");
            live.pump = live.ReadAsync();
            return live;
        }
        private async Task ReadAsync()
        {
            var buffer = new byte[8192];
            var pending = "";
            try
            {
                while (!stop.IsCancellationRequested)
                {
                    var frame = await socket.ReceiveAsync(buffer, stop.Token);
                    if (frame.MessageType == WebSocketMessageType.Close) return;
                    pending += Encoding.UTF8.GetString(buffer, 0, frame.Count);
                    int end;
                    while ((end = pending.IndexOf('\u001e')) >= 0)
                    {
                        var message = JsonNode.Parse(pending[..end]);
                        pending = pending[(end + 1)..];
                        if (message?["target"]?.GetValue<string>() == "NotificationReceived") Messages.Enqueue(message["arguments"]![0]!.DeepClone());
                    }
                }
            }
            catch (OperationCanceledException) { }
            catch (WebSocketException) when (stop.IsCancellationRequested) { }
        }
        public async Task WaitCountAsync(int count)
        {
            for (var i = 0; i < 100 && Messages.Count < count; i++) await Task.Delay(20);
            if (Messages.Count < count) throw new Exception($"Expected {count} live notifications, got {Messages.Count}");
        }
        public async ValueTask DisposeAsync()
        {
            stop.Cancel();
            await pump;
            socket.Dispose();
            stop.Dispose();
        }
    }
}

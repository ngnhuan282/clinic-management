using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;

internal static class ClinicRealtimeChecks
{
    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password, Action<bool, string> check)
    {
        async Task<(int Status, JsonNode? Body)> Request(HttpMethod method, string path, string token, object? body = null)
        {
            using var request = new HttpRequestMessage(method, path);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            return ((int)response.StatusCode, string.IsNullOrWhiteSpace(text) ? null : JsonNode.Parse(text));
        }
        async Task<JsonNode?> Send(HttpMethod method, string path, string token, object? body = null, int status = 200)
        {
            var response = await Request(method, path, token, body);
            check(response.Status == status, $"Realtime {method} {path}: {response.Status} (expected {status})"
                + (response.Status == status ? "" : $" {response.Body}"));
            return response.Body;
        }
        async Task<string> Login(string name) => (await Send(HttpMethod.Post, "api/auth/login", "",
            new { username = name, password }))!["result"]!["accessToken"]!.GetValue<string>();

        var patientRole = await db.Roles.Where(x => x.RoleName == RoleConstants.Patient).Select(x => x.RoleId).SingleAsync();
        var doctorRole = await db.Roles.Where(x => x.RoleName == RoleConstants.Doctor).Select(x => x.RoleId).SingleAsync();
        var receptionRole = await db.Roles.Where(x => x.RoleName == RoleConstants.Receptionist).Select(x => x.RoleId).SingleAsync();
        var users = new[] { ("livepatient", patientRole), ("otherpatient", patientRole), ("otherdoctor", doctorRole), ("otherreception", receptionRole) }
            .Select(x => new User { Username = x.Item1, FullName = x.Item1, RoleId = x.Item2,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), CreatedAt = DateTime.UtcNow }).ToArray();
        db.Users.AddRange(users);
        await db.SaveChangesAsync();
        (await db.Doctors.SingleAsync(x => x.DoctorId == 2)).UserId = users[2].UserId;
        var today = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Asia/Ho_Chi_Minh").Date;
        var date = today.AddDays(5);
        foreach (var (doctorId, day) in new[] { (1, date), (2, date.AddDays(1)) })
        {
            var schedule = new DoctorSchedule { DoctorId = doctorId, RoomId = doctorId,
                WorkDate = DateOnly.FromDateTime(day), StartTime = TimeSpan.FromHours(10), EndTime = TimeSpan.FromHours(12),
                MaxPatients = 4, Status = "Approved", CreatedAt = DateTime.UtcNow };
            for (var hour = 10.0; hour < 12; hour += 0.5)
                schedule.TimeSlots.Add(new TimeSlot { StartTime = TimeSpan.FromHours(hour), EndTime = TimeSpan.FromHours(hour + 0.5),
                    MaxCapacity = 1, IsAvailable = true });
            db.DoctorSchedules.Add(schedule);
        }
        await db.SaveChangesAsync();
        var patientToken = await Login("livepatient");
        var otherPatientToken = await Login("otherpatient");
        var doctorToken = await Login("testdoctor");
        var otherDoctorToken = await Login("otherdoctor");
        var receptionToken = await Login("testreceptionist");
        var otherReceptionToken = await Login("otherreception");
        var adminToken = await Login("testadmin");
        await using var patient = await LiveEvents.ConnectAsync(client.BaseAddress!, patientToken);
        await using var otherPatient = await LiveEvents.ConnectAsync(client.BaseAddress!, otherPatientToken);
        await using var doctor = await LiveEvents.ConnectAsync(client.BaseAddress!, doctorToken);
        await using var otherDoctor = await LiveEvents.ConnectAsync(client.BaseAddress!, otherDoctorToken);
        await using var reception = await LiveEvents.ConnectAsync(client.BaseAddress!, receptionToken);
        await using var otherReception = await LiveEvents.ConnectAsync(client.BaseAddress!, otherReceptionToken);
        await using var lab = await LiveEvents.ConnectAsync(client.BaseAddress!, await Login("testlab"));
        object Booking(string time) => new { doctorId = 1, appointmentDate = date.ToString("yyyy-MM-dd"), startTime = time,
            patientName = "Realtime patient", patientPhone = "0900123456", reason = "Realtime verification" };
        var id = (await Send(HttpMethod.Post, "api/appointments", patientToken, Booking("10:00:00")))!["result"]!["appointmentId"]!.GetValue<int>();
        await Task.WhenAll(patient.WaitAsync("AppointmentChanged", "change", "Created"), doctor.WaitAsync("AppointmentChanged", "change", "Created"),
            reception.WaitAsync("AppointmentChanged", "change", "Created"), otherReception.WaitAsync("AppointmentChanged", "change", "Created"),
            otherPatient.WaitAsync("SlotAvailabilityChanged"));
        check(otherPatient.Count("AppointmentChanged") == 0 && otherDoctor.Count("AppointmentChanged") == 0 && lab.Events.IsEmpty,
            "Appointment snapshots reach only Receptionists, assigned doctor and owning patient");
        check(otherPatient.Events.Where(x => x.Name == "SlotAvailabilityChanged").All(x => x.Payload.AsObject().Count == 2),
            "Shared availability events contain doctor/date only, with no patient or appointment identifiers");
        await Send(HttpMethod.Patch, $"api/appointments/{id}/confirm", receptionToken);
        await patient.WaitAsync("AppointmentChanged", "status", "Confirmed");
        var count = patient.Count("AppointmentChanged");
        await Send(HttpMethod.Patch, $"api/appointments/{id}/confirm", receptionToken, status: 400);
        await Task.Delay(100);
        check(patient.Count("AppointmentChanged") == count, "Invalid repeated confirmation emits no event");

        await Send(HttpMethod.Patch, $"api/appointments/{id}/reschedule", receptionToken,
            new { doctorId = 2, appointmentDate = date.AddDays(1).ToString("yyyy-MM-dd"), startTime = "10:00:00" });
        await Task.WhenAll(doctor.WaitAsync("AppointmentChanged", "change", "Rescheduled"), otherDoctor.WaitAsync("AppointmentChanged", "change", "Rescheduled"));
        check(doctor.Events.Last(x => x.Name == "AppointmentChanged").Payload["previousDoctorId"]!.GetValue<int>() == 1,
            "Rescheduling refreshes both previous and new assigned doctors");
        var oldSlots = (await Send(HttpMethod.Get, $"api/appointments/available-slots?doctorId=1&date={date:yyyy-MM-dd}", patientToken))!["result"]!.AsArray();
        check(oldSlots.First()!["isAvailable"]!.GetValue<bool>(), "Rescheduling releases the old slot");
        var moved = await db.Appointments.AsNoTracking().SingleAsync(x => x.AppointmentId == id);
        check(moved.TimeSlotId == await db.TimeSlots.Where(x => x.Schedule.DoctorId == 2 && x.StartTime == TimeSpan.FromHours(10)).Select(x => (Guid?)x.SlotId).SingleAsync(),
            "Rescheduled appointment references the new time slot");
        await patient.WaitAsync("AppointmentChanged", "change", "Rescheduled");
        count = patient.Count("AppointmentChanged");
        await Send(HttpMethod.Patch, $"api/appointments/{id}/reschedule", receptionToken,
            new { doctorId = 2, appointmentDate = date.AddDays(1).ToString("yyyy-MM-dd"), startTime = "10:00:00" });
        await Task.Delay(100);
        check(patient.Count("AppointmentChanged") == count, "An unchanged reschedule emits no duplicate event");
        await Send(HttpMethod.Patch, $"api/appointments/{id}/cancel", receptionToken);
        await patient.WaitAsync("AppointmentChanged", "status", "Cancelled");
        var newSlots = (await Send(HttpMethod.Get, $"api/appointments/available-slots?doctorId=2&date={date.AddDays(1):yyyy-MM-dd}", patientToken))!["result"]!.AsArray();
        check(newSlots.First()!["isAvailable"]!.GetValue<bool>(), "Cancellation releases the booked slot");

        var race = await Task.WhenAll(Request(HttpMethod.Post, "api/appointments", patientToken, Booking("10:00:00")),
            Request(HttpMethod.Post, "api/appointments", otherPatientToken, Booking("10:00:00")));
        check(race.Count(x => x.Status == 200) == 1 && race.Count(x => x.Status == 409) == 1,
            "Concurrent bookings preserve one successful booking and one 409 conflict");
        check(await db.Appointments.CountAsync(x => x.DoctorId == 1 && x.AppointmentDate == date && x.StartTime == TimeSpan.FromHours(10)
            && x.Status != "Cancelled") == 1, "Database unique index still prevents duplicate occupied slots");
        var secondId = (await Send(HttpMethod.Post, "api/appointments", patientToken, Booking("10:30:00")))!["result"]!["appointmentId"]!.GetValue<int>();
        await reception.WaitAsync("AppointmentChanged", "appointmentId", secondId.ToString());
        var notifications = await db.Notifications.CountAsync();
        count = reception.Count("AppointmentChanged");
        await Send(HttpMethod.Patch, $"api/appointments/{secondId}/reschedule", receptionToken,
            new { doctorId = 1, appointmentDate = date.ToString("yyyy-MM-dd"), startTime = "10:00:00" }, 409);
        await Task.Delay(100);
        check(reception.Count("AppointmentChanged") == count && await db.Notifications.CountAsync() == notifications,
            "Conflicting reschedule persists no notification and emits no event");

        var profile = new Patient { FullName = "Realtime patient", Phone = "0900123456", CreatedAt = DateTime.UtcNow };
        db.Patients.Add(profile);
        await db.SaveChangesAsync();
        var clinical = new Appointment { DoctorId = 1, PatientId = users[0].UserId, PatientProfileId = profile.PatientId,
            PatientName = profile.FullName, PatientPhone = profile.Phone, AppointmentDate = today,
            StartTime = TimeSpan.FromHours(15), EndTime = TimeSpan.FromHours(15.5), Status = "Confirmed", Reason = "Live check-in", CreatedAt = DateTime.UtcNow };
        db.Appointments.Add(clinical);
        await db.SaveChangesAsync();
        var legacyInvoice = (await Send(HttpMethod.Post, "api/Invoices", adminToken, new { appointmentId = 0,
            patientId = profile.PatientId, billingStage = "Book", paymentMethod = "Cash", items = new[] {
                new { sourceType = "Book", sourceId = 9002, itemName = "Legacy Book", quantity = 1, unitPrice = 10000 } } }))!;
        await otherReception.WaitAsync("BookInvoiceChanged", "invoiceId", legacyInvoice["id"]!.ToString());
        await Task.Delay(100);
        check(patient.Count("BookInvoiceChanged") == 0 && doctor.Count("BookInvoiceChanged") == 0,
            "An unlinked legacy Book invoice notifies reception without inferring patient/doctor recipients from ambiguous PatientId");
        var invoiceId = (await Send(HttpMethod.Post, $"api/patients/{profile.PatientId}/book-invoices", receptionToken,
            new { amount = 10000 }))!["result"]!["bookInvoiceId"]!.GetValue<int>();
        await otherReception.WaitAsync("BookInvoiceChanged", "status", "Unpaid");
        await Send(HttpMethod.Post, $"api/book-invoices/{invoiceId}/issue-book", receptionToken, new { bookNumber = "LIVE-UNPAID" }, 409);
        await Send(HttpMethod.Patch, $"api/book-invoices/{invoiceId}/pay", receptionToken);
        await Task.WhenAll(otherReception.WaitAsync("BookInvoiceChanged", "status", "Paid"), patient.WaitAsync("BookInvoiceChanged", "status", "Paid"),
            doctor.WaitAsync("BookInvoiceChanged", "status", "Paid"));
        count = otherReception.Count("BookInvoiceChanged");
        await Send(HttpMethod.Patch, $"api/book-invoices/{invoiceId}/pay", receptionToken, status: 409);
        await Task.Delay(100);
        check(otherReception.Count("BookInvoiceChanged") == count && otherPatient.Count("BookInvoiceChanged") == 0,
            "Paid reaches the other reception session and related roles once, with no unrelated patient delivery");
        var bookId = (await Send(HttpMethod.Post, $"api/book-invoices/{invoiceId}/issue-book", receptionToken,
            new { bookNumber = "LIVE-BOOK" }))!["result"]!["patientBookId"]!.GetValue<int>();
        await otherReception.WaitAsync("PatientBookChanged", "patientBookId", bookId.ToString());
        await Send(HttpMethod.Post, $"api/book-invoices/{invoiceId}/issue-book", otherReceptionToken,
            new { bookNumber = "LIVE-DUPLICATE" }, 409);
        check(await db.PatientBooks.CountAsync(x => x.BookInvoiceId == invoiceId) == 1, "A Paid invoice can issue exactly one book across reception sessions");

        var replacementInvoice = (await Send(HttpMethod.Post, $"api/patients/{profile.PatientId}/book-invoices", receptionToken,
            new { amount = 15000 }))!["result"]!["bookInvoiceId"]!.GetValue<int>();
        var cashierBody = new { appointmentId = clinical.AppointmentId, patientId = profile.PatientId, billingStage = "Book", paymentMethod = "Cash",
            items = new[] { new { sourceType = "Book", sourceId = replacementInvoice, itemName = "Cấp lại sổ", quantity = 1, unitPrice = 15000 } } };
        await Send(HttpMethod.Post, "api/Invoices", adminToken, new { appointmentId = clinical.AppointmentId, patientId = profile.PatientId,
            billingStage = "Book", paymentMethod = "Cash", items = new[] { new { sourceType = "Book", sourceId = replacementInvoice,
                itemName = "Wrong amount", quantity = 1, unitPrice = 1 } } }, 400);
        check(await db.BookInvoices.AsNoTracking().AnyAsync(x => x.BookInvoiceId == replacementInvoice && x.Status == "Unpaid"),
            "Rejected Book payment leaves the reception invoice Unpaid");
        await Send(HttpMethod.Post, "api/Invoices", adminToken, cashierBody);
        await Send(HttpMethod.Post, "api/Invoices", adminToken, cashierBody, 400);
        check(await db.BookInvoices.AsNoTracking().AnyAsync(x => x.BookInvoiceId == replacementInvoice && x.Status == "Paid"),
            "Cashier Book payment updates the linked reception invoice in the same transaction");
        await Send(HttpMethod.Post, $"api/book-invoices/{replacementInvoice}/issue-book", otherReceptionToken,
            new { bookNumber = "LIVE-BOOK" }, 409);
        check(await db.PatientBooks.AsNoTracking().AnyAsync(x => x.PatientBookId == bookId && x.Status == "Issued"),
            "Failed replacement rolls back voiding the previous book");
        var replacementBookId = (await Send(HttpMethod.Post, $"api/book-invoices/{replacementInvoice}/issue-book", otherReceptionToken,
            new { bookNumber = "LIVE-REISSUED" }))!["result"]!["patientBookId"]!.GetValue<int>();
        check(await db.PatientBooks.CountAsync(x => x.PatientId == profile.PatientId) == 2
            && await db.PatientBooks.CountAsync(x => x.PatientId == profile.PatientId && x.Status == "Issued") == 1
            && await db.PatientBooks.AsNoTracking().AnyAsync(x => x.PatientBookId == replacementBookId && x.PreviousBookId == bookId),
            "Reissuing preserves the previous book, voids it and keeps exactly one active replacement");
        bookId = replacementBookId;

        var checkInBody = new { patientProfileId = profile.PatientId, patientBookId = bookId, bookPresented = false };
        await Send(HttpMethod.Patch, $"api/appointments/{clinical.AppointmentId}/check-in", receptionToken,
            new { patientProfileId = profile.PatientId, patientBookId = 999999 }, 404);
        check(patient.Count("CheckInChanged") == 0, "Failed check-in emits no event");
        await Send(HttpMethod.Patch, $"api/appointments/{clinical.AppointmentId}/check-in", receptionToken, checkInBody);
        await Task.WhenAll(patient.WaitAsync("CheckInChanged"), doctor.WaitAsync("CheckInChanged"), otherReception.WaitAsync("CheckInChanged"));
        await Send(HttpMethod.Patch, $"api/appointments/{clinical.AppointmentId}/check-in", receptionToken, checkInBody, 400);
        await Task.Delay(100);
        check(patient.Count("CheckInChanged") == 1 && otherDoctor.Count("CheckInChanged") == 0,
            "Check-in is delivered once to all three related roles and excludes other doctors");
        await Send(HttpMethod.Patch, $"api/appointments/{clinical.AppointmentId}/start-examination", doctorToken);
        await patient.WaitAsync("AppointmentChanged", "status", "InProgress");
        count = patient.Count("AppointmentChanged");
        await Send(HttpMethod.Patch, $"api/appointments/{clinical.AppointmentId}/start-examination", doctorToken);
        await Task.Delay(100);
        check(patient.Count("AppointmentChanged") == count, "Already-started examination emits no duplicate status event");
        var inUseInvoice = (await Send(HttpMethod.Post, $"api/patients/{profile.PatientId}/book-invoices", receptionToken,
            new { amount = 10000 }))!["result"]!["bookInvoiceId"]!.GetValue<int>();
        await Send(HttpMethod.Patch, $"api/book-invoices/{inUseInvoice}/pay", receptionToken);
        await Send(HttpMethod.Post, $"api/book-invoices/{inUseInvoice}/issue-book", receptionToken, new { bookNumber = "LIVE-IN-USE" }, 409);
        check(await db.PatientBooks.AsNoTracking().AnyAsync(x => x.PatientBookId == bookId && x.Status == "Issued"),
            "A book used by an unfinished examination remains active when replacement is refused");
        var recordId = (await Send(HttpMethod.Post, "api/medical-records", doctorToken,
            new { appointmentId = clinical.AppointmentId, symptoms = "Realtime symptoms" }, 201))!["result"]!["medicalRecordId"]!.GetValue<int>();
        var disease = new Disease { DiseaseCode = "LIVE", DiseaseName = "Realtime diagnosis", CreatedAt = DateTime.UtcNow };
        db.Diseases.Add(disease);
        await db.SaveChangesAsync();
        await Send(HttpMethod.Put, $"api/medical-records/{recordId}", doctorToken, new { symptoms = "Realtime symptoms", conclusion = "Done",
            markCompleted = true, paperBookConfirmed = true, diagnoses = new[] { new { diseaseId = disease.DiseaseId, isPrimary = true } } });
        await Task.WhenAll(patient.WaitAsync("AppointmentChanged", "status", "Completed"), otherReception.WaitAsync("AppointmentChanged", "status", "Completed"));
        check(await db.Appointments.AsNoTracking().AnyAsync(x => x.AppointmentId == clinical.AppointmentId && x.Status == "Completed"),
            "Medical-record completion updates the appointment and all related role views");
        check(!await db.Notifications.AnyAsync(x => x.UserId == users[0].UserId || x.UserId == users[1].UserId),
            "Patient appointment, Paid and check-in updates use realtime events without adding notification history");
    }

    private sealed class LiveEvents : IAsyncDisposable
    {
        private readonly ClientWebSocket socket = new();
        private readonly CancellationTokenSource stop = new();
        private Task pump = Task.CompletedTask;
        public ConcurrentQueue<(string Name, JsonNode Payload)> Events { get; } = new();
        public int Count(string name) => Events.Count(x => x.Name == name);
        public static async Task<LiveEvents> ConnectAsync(Uri baseUrl, string token)
        {
            var live = new LiveEvents();
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
                        if (message?["target"]?.GetValue<string>() is { } name)
                            Events.Enqueue((name, message["arguments"]![0]!.DeepClone()));
                    }
                }
            }
            catch (OperationCanceledException) { }
            catch (WebSocketException) when (stop.IsCancellationRequested) { }
        }
        public async Task WaitAsync(string name, string? property = null, string? value = null)
        {
            for (var i = 0; i < 250; i++)
            {
                if (Events.Any(x => x.Name == name && (property == null || x.Payload[property]?.ToString() == value))) return;
                await Task.Delay(20);
            }
            throw new Exception($"Expected live event {name} {property}={value}");
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

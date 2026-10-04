using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json.Nodes;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;

var rootDirectory = new DirectoryInfo(AppContext.BaseDirectory);
while (rootDirectory != null && !File.Exists(Path.Combine(rootDirectory.FullName,
           "backend", "ClinicManagement", "ClinicManagement.csproj")))
    rootDirectory = rootDirectory.Parent;
var root = rootDirectory?.FullName ?? throw new DirectoryNotFoundException("Repository root not found");
var database = "ClinicWeek2Test_" + Guid.NewGuid().ToString("N");
var connection = $"Server=(localdb)\\MSSQLLocalDB;Database={database};Trusted_Connection=True;TrustServerCertificate=True";
var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(connection).Options;
await using var db = new ApplicationDbContext(options);
Process? server = null;
var checks = 0;
var password = "Test-" + Convert.ToHexString(RandomNumberGenerator.GetBytes(12));
var listener = new System.Net.Sockets.TcpListener(IPAddress.Loopback, 0);
listener.Start();
var port = ((IPEndPoint)listener.LocalEndpoint).Port;
listener.Stop();
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}/"), Timeout = TimeSpan.FromSeconds(30) };
var serverLog = new System.Collections.Concurrent.ConcurrentQueue<string>();
void Check(bool ok, string description)
{
    if (!ok) throw new Exception(description);
    checks++;
    Console.WriteLine($"PASS {description}");
}
async Task<JsonNode?> Send(HttpMethod method, string path, object? body = null, int status = 200)
{
    using var request = new HttpRequestMessage(method, path);
    if (body != null) request.Content = JsonContent.Create(body);
    using var response = await client.SendAsync(request);
    var text = await response.Content.ReadAsStringAsync();
    Check((int)response.StatusCode == status, $"{method} {path}: expected {status}, got {(int)response.StatusCode}");
    return string.IsNullOrWhiteSpace(text) ? null : JsonNode.Parse(text);
}
try
{
    if (args.Contains("--a5") || args.Contains("--a5-ui"))
    {
        // The merged legacy chain creates PatientBooks twice. A5 verifies against the current
        // baseline schema and applies its own migration without rewriting team migrations.
        await db.Database.EnsureCreatedAsync();
        await A5Checks.VerifyNotificationMigrationAsync(db, Check);
    }
    else
    {
        await db.Database.MigrateAsync();
        Check(!(await db.Database.GetPendingMigrationsAsync()).Any(), "All migrations apply to an empty SQL Server database");
    }
    Check(await db.Departments.CountAsync() == 3 && await db.Rooms.CountAsync() == 3 && await db.Specializations.CountAsync() == 3, "Catalog master data seeded");
    await db.Database.ExecuteSqlRawAsync(await File.ReadAllTextAsync(Path.Combine(root, "backend/ClinicManagement/Data/Seed/pharmacy-demo-data.sql")));
    Check(await db.Medicines.AnyAsync() && await db.Inventory.AnyAsync(), "Pharmacy demo seed works");
    foreach (var (name, role) in new[] { ("testadmin", 1), ("testdoctor", 2), ("testreceptionist", 3), ("testlab", 5) })
        db.Users.Add(new User { Username = name, FullName = name, PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), RoleId = role, CreatedAt = DateTime.UtcNow });
    await db.SaveChangesAsync();
    (await db.Doctors.SingleAsync(x => x.DoctorId == 1)).UserId =
        (await db.Users.SingleAsync(x => x.Username == "testdoctor")).UserId;
    await db.SaveChangesAsync();

    var start = new ProcessStartInfo("dotnet") { WorkingDirectory = Path.Combine(root, "backend/ClinicManagement"), UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
    start.ArgumentList.Add(Path.Combine(AppContext.BaseDirectory, "ClinicManagement.dll"));
    start.Environment["ASPNETCORE_URLS"] = client.BaseAddress.ToString().TrimEnd('/');
    start.Environment["ASPNETCORE_ENVIRONMENT"] = "Development";
    start.Environment["ConnectionStrings__DefaultConnection"] = connection;
    start.Environment["Jwt__Key"] = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
    if (args.Contains("--ui") || args.Contains("--a5-ui")) start.Environment["Cors__FrontendUrl"] = "http://127.0.0.1:5190";
    server = Process.Start(start)!;
    server.OutputDataReceived += (_, e) => { if (e.Data != null) serverLog.Enqueue(e.Data); };
    server.ErrorDataReceived += (_, e) => { if (e.Data != null) serverLog.Enqueue(e.Data); };
    server.BeginOutputReadLine(); server.BeginErrorReadLine();
    for (var i = 0; i < 100; i++)
    {
        try { if ((await client.GetAsync("swagger/v1/swagger.json")).IsSuccessStatusCode) break; }
        catch (HttpRequestException) { }
        if (server.HasExited) throw new Exception("API exited: " + string.Join('\n', serverLog));
        await Task.Delay(200);
    }
    await Send(HttpMethod.Get, "swagger/v1/swagger.json");
    if (args.Contains("--a5") || args.Contains("--a5-ui"))
    {
        await A5Checks.RunAsync(client, db, password, Check);
        Console.WriteLine($"SUCCESS: {checks} A5 checks passed.");
        if (args.Contains("--a5-ui"))
        {
            Console.WriteLine("AUTH_UI_SESSION:" + System.Text.Json.JsonSerializer.Serialize(new
            {
                baseUrl = client.BaseAddress, password, date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(70)),
                doctorName = await db.Doctors.Where(x => x.DoctorId == 1).Select(x => x.FullName).SingleAsync()
            }));
            await Console.In.ReadLineAsync();
        }
        return;
    }
    if (args.Contains("--a5"))
    {
        await A5Checks.RunAsync(client, db, password, Check);
        Console.WriteLine($"SUCCESS: {checks} A5 checks passed.");
        return;
    }
    if (args.Contains("--a4"))
    {
        await ScheduleReviewChecks.VerifyRoleMigrationCollisionAsync(db, Check);
        await ScheduleReviewChecks.RunAsync(client, db, password, Check);
        Console.WriteLine($"SUCCESS: {checks} A4 checks passed.");
        return;
    }
    if (args.Contains("--ui"))
    {
        // Consumed by the browser harness; test credentials never enter the repository.
        Console.WriteLine("AUTH_UI_SESSION:" + System.Text.Json.JsonSerializer.Serialize(new { baseUrl = client.BaseAddress, password }));
        var result = JsonNode.Parse(await Console.In.ReadLineAsync() ?? "{}")!;
        if (result["username"] is { } username)
        {
            var registered = await db.Users.SingleAsync(x => x.Username == username.GetValue<string>());
            Check(registered.FullName == "Nguyễn Văn Kiểm Thử" && registered.Phone == "0912345678" && registered.Email == result["email"]!.GetValue<string>(), "Browser registration persists full name, phone and email in SQL Server");
        }
        return;
    }
    using (var preflight = new HttpRequestMessage(HttpMethod.Options, "api/auth/login"))
    {
        preflight.Headers.Add("Origin", "http://localhost:5173");
        preflight.Headers.Add("Access-Control-Request-Method", "POST");
        using var response = await client.SendAsync(preflight);
        Check(response.Headers.Contains("Access-Control-Allow-Origin"), "CORS preflight accepts frontend");
    }
    var patient = (await Send(HttpMethod.Post, "api/auth/register", new { username = "testpatient", password, fullName = "Test patient" }))!["result"]!;
    Check(patient["role"]!.GetValue<string>() == "Patient", "Registration assigns Patient");
    var savedPatient = await db.Users.SingleAsync(x => x.Username == "testpatient");
    Check(savedPatient.PasswordHash != password && BCrypt.Net.BCrypt.Verify(password, savedPatient.PasswordHash), "Passwords use BCrypt");
    var rawRefresh = patient["refreshToken"]!.GetValue<string>();
    Check(await db.RefreshTokens.AnyAsync(x => x.UserId == savedPatient.UserId && x.TokenHash != rawRefresh && x.TokenHash.Length == 64), "Refresh token stored as hash");
    await Send(HttpMethod.Post, "api/auth/login", new { username = "testpatient", password = "wrong" }, 401);
    var refreshed = (await Send(HttpMethod.Post, "api/auth/refresh", new { refreshToken = rawRefresh }))!["result"]!;
    await Send(HttpMethod.Post, "api/auth/refresh", new { refreshToken = rawRefresh }, 401);
    await Send(HttpMethod.Post, "api/auth/logout", new { refreshToken = refreshed["refreshToken"]!.GetValue<string>() }, 204);
    await Send(HttpMethod.Post, "api/auth/refresh", new { refreshToken = refreshed["refreshToken"]!.GetValue<string>() }, 401);
    await Send(HttpMethod.Get, "api/departments", status: 401);
    await Send(HttpMethod.Get, "api/LabTestTypes", status: 401);
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", patient["accessToken"]!.GetValue<string>());
    await Send(HttpMethod.Get, "api/departments", status: 403);
    await Send(HttpMethod.Get, "api/LabTestTypes", status: 403);
    var admin = (await Send(HttpMethod.Post, "api/auth/login", new { username = "testadmin", password }))!["result"]!;
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", admin["accessToken"]!.GetValue<string>());
    foreach (var resource in new[] { "departments", "specializations", "rooms", "medicines", "medicine-categories", "suppliers", "inventory" })
        await Send(HttpMethod.Get, "api/" + resource);
    var department = (await Send(HttpMethod.Post, "api/departments", new { code = "QA", name = "Test department" }))!["result"]!;
    var departmentId = department["departmentId"]!.GetValue<int>();
    await Send(HttpMethod.Put, $"api/departments/{departmentId}", new { code = "QA", name = "Updated department", isActive = true });
    await Send(HttpMethod.Patch, $"api/departments/{departmentId}/status", false);
    var specialization = (await Send(HttpMethod.Post, "api/specializations", new { code = "QA-SP", name = "Test specialization", departmentId = 1 }))!["result"]!;
    var specializationId = specialization["specializationId"]!.GetValue<int>();
    await Send(HttpMethod.Put, $"api/specializations/{specializationId}", new { code = "QA-SP", name = "Updated specialization", departmentId = 1, isActive = true });
    await Send(HttpMethod.Patch, $"api/specializations/{specializationId}/status", false);
    var room = (await Send(HttpMethod.Post, "api/rooms", new { roomNumber = "QA-1", name = "Test room", departmentId = 1 }))!["result"]!;
    var roomId = room["roomId"]!.GetValue<int>();
    await Send(HttpMethod.Put, $"api/rooms/{roomId}", new { roomNumber = "QA-1", name = "Updated room", departmentId = 1, isActive = true });
    await Send(HttpMethod.Patch, $"api/rooms/{roomId}/status", false);
    var category = (await Send(HttpMethod.Post, "api/medicine-categories", new { categoryName = "Test category" }, 201))!["result"]!;
    var categoryId = category["categoryId"]!.GetValue<int>();
    await Send(HttpMethod.Put, $"api/medicine-categories/{categoryId}", new { categoryName = "Updated category" });
    var supplier = (await Send(HttpMethod.Post, "api/suppliers", new { supplierName = "Test supplier" }, 201))!["result"]!;
    var supplierId = supplier["supplierId"]!.GetValue<int>();
    await Send(HttpMethod.Put, $"api/suppliers/{supplierId}", new { supplierName = "Updated supplier" });
    var medicinePayload = new { medicineName = "Test medicine", categoryId, supplierId, unit = "tablet", unitPrice = 2500m };
    var medicine = (await Send(HttpMethod.Post, "api/medicines", medicinePayload, 201))!["result"]!;
    var medicineId = medicine["medicineId"]!.GetValue<int>();
    await Send(HttpMethod.Put, $"api/medicines/{medicineId}", medicinePayload);
    var inventoryPayload = new { medicineId, batchNumber = "QA-BATCH", quantityInStock = 10, expiryDate = DateTime.Today.AddYears(1).ToString("yyyy-MM-dd") };
    var inventory = (await Send(HttpMethod.Post, "api/inventory", inventoryPayload, 201))!["result"]!;
    var inventoryId = inventory["inventoryId"]!.GetValue<int>();
    await Send(HttpMethod.Put, $"api/inventory/{inventoryId}", inventoryPayload);
    await Send(HttpMethod.Post, "api/inventory", inventoryPayload, 409);
    await Send(HttpMethod.Post, "api/inventory", new { medicineId, batchNumber = "INVALID", quantityInStock = -1, expiryDate = "2030-01-01" }, 400);
    await Send(HttpMethod.Delete, $"api/medicines/{medicineId}", status: 409);
    await Send(HttpMethod.Delete, $"api/inventory/{inventoryId}");
    await Send(HttpMethod.Delete, $"api/medicines/{medicineId}");
    await Send(HttpMethod.Delete, $"api/medicine-categories/{categoryId}");
    await Send(HttpMethod.Delete, $"api/suppliers/{supplierId}");
    var lab = (await Send(HttpMethod.Post, "api/LabTestTypes", new { name = "Test lab", price = 125000m }, 201))!;
    var labId = lab["id"]!.GetValue<int>();
    await Send(HttpMethod.Put, $"api/LabTestTypes/{labId}", new { name = "Updated lab", price = 150000m, isActive = true }, 204);
    await Send(HttpMethod.Post, "api/LabTestTypes", new { name = "Invalid", price = -1 }, 400);
    await Send(HttpMethod.Delete, $"api/LabTestTypes/{labId}", status: 204);
    Check((await Send(HttpMethod.Get, "api/LabTestTypes"))!.AsArray().Count == 0, "Lab soft delete hides inactive entries");
    var doctor = (await Send(HttpMethod.Post, "api/auth/login", new { username = "testdoctor", password }))!["result"]!;
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", doctor["accessToken"]!.GetValue<string>());
    await Send(HttpMethod.Get, "api/LabTestTypes");
    await Send(HttpMethod.Post, "api/LabTestTypes", new { name = "Forbidden", price = 1 }, 403);
    client.DefaultRequestHeaders.Authorization = null;
    await Send(HttpMethod.Post, "api/appointments", new { }, 401);
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", patient["accessToken"]!.GetValue<string>());
    await Send(HttpMethod.Get, "api/appointments/departments");
    await Send(HttpMethod.Get, "api/doctors?departmentId=1");
    var date = DateTime.Today.AddDays(2);
    while (date.DayOfWeek == DayOfWeek.Sunday) date = date.AddDays(1);
    var dateText = date.ToString("yyyy-MM-dd");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", admin["accessToken"]!.GetValue<string>());
    await Send(HttpMethod.Post, "api/doctor-schedules", new { doctorId = 1, roomId = 1, workDate = dateText, shift = 0, startTime = "08:00", endTime = "12:00", slotDurationMinutes = 30, maxCapacity = 1 });
    await Send(HttpMethod.Post, "api/doctor-schedules", new { doctorId = 1, roomId = 1, workDate = dateText, shift = 1, startTime = "13:00", endTime = "15:30", slotDurationMinutes = 30, maxCapacity = 1 });
    foreach (var shift in new[] { Shift.Morning, Shift.Afternoon })
    {
        var approvedSchedule = await db.DoctorSchedules.SingleAsync(x => x.DoctorId == 1 && x.WorkDate == DateOnly.FromDateTime(date) && x.Shift == shift);
        var approvedRequest = new DoctorScheduleRequest
        {
            DoctorId = approvedSchedule.DoctorId, RoomId = approvedSchedule.RoomId,
            WorkDate = approvedSchedule.WorkDate, StartTime = approvedSchedule.StartTime,
            EndTime = approvedSchedule.EndTime, Status = "Approved", CreatedAt = DateTime.UtcNow
        };
        db.DoctorScheduleRequests.Add(approvedRequest);
        approvedSchedule.Request = approvedRequest;
    }
    await db.SaveChangesAsync();
    await Send(HttpMethod.Post, "api/doctor-schedules", new { doctorId = 1, roomId = 2, workDate = dateText, shift = 0, startTime = "09:00", endTime = "10:00", slotDurationMinutes = 30, maxCapacity = 1 }, 409);
    await Send(HttpMethod.Post, "api/doctor-schedules", new { doctorId = 1, roomId = 2, workDate = dateText, shift = 0, startTime = "17:00", endTime = "16:00", slotDurationMinutes = 30, maxCapacity = 1 }, 400);
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", patient["accessToken"]!.GetValue<string>());
    var slots = (await Send(HttpMethod.Get, $"api/appointments/available-slots?doctorId=1&date={dateText}"))!["result"]!.AsArray();
    Check(slots.Count == 13, "Availability comes from created working shifts");
    var schedule = await db.DoctorSchedules.FirstAsync(x => x.DoctorId == 1 && x.WorkDate == DateOnly.FromDateTime(date) && x.Shift == Shift.Morning);
    schedule.IsActive = false; await db.SaveChangesAsync();
    var reducedSlots = (await Send(HttpMethod.Get, $"api/appointments/available-slots?doctorId=1&date={dateText}"))!["result"]!.AsArray();
    Check(reducedSlots.Count < slots.Count, "Changing database schedule changes available slots");
    schedule.IsActive = true; await db.SaveChangesAsync();
    var body = new { doctorId = 1, appointmentDate = dateText, startTime = "08:00:00", patientName = "Booking test", patientPhone = "0901234567", reason = "Test appointment" };
    var concurrent = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => client.PostAsJsonAsync("api/appointments", body)));
    Check(concurrent.Count(x => x.StatusCode == HttpStatusCode.OK) == 1 && concurrent.Count(x => x.StatusCode == HttpStatusCode.Conflict) == 7, "Eight concurrent bookings: exactly one succeeds, seven return 409");
    foreach (var response in concurrent) response.Dispose();
    Check(await db.Appointments.CountAsync() == 1, "Unique database constraint prevents double booking");
    Check((await db.Appointments.SingleAsync()).PatientId == savedPatient.UserId, "Booking belongs to the authenticated patient");
    var booked = (await Send(HttpMethod.Get, $"api/appointments/available-slots?doctorId=1&date={dateText}"))!["result"]!.AsArray();
    Check(!booked.First(x => x!["startTime"]!.GetValue<string>() == "08:00:00")!["isAvailable"]!.GetValue<bool>(), "Booked slot is unavailable");
    var appointment = await db.Appointments.SingleAsync(); appointment.Status = "Cancelled"; await db.SaveChangesAsync();
    var rebooked = (await Send(HttpMethod.Post, "api/appointments", body))!["result"]!;
    await Send(HttpMethod.Post, "api/appointments", new { doctorId = 1, appointmentDate = dateText, startTime = "12:00:00", patientName = "Test", patientPhone = "0901234567", reason = "Invalid shift" }, 400);
    await Send(HttpMethod.Get, "api/appointments/available-slots?doctorId=1&date=2000-01-01", status: 400);

    var rebookedId = rebooked["appointmentId"]!.GetValue<int>();
    await Send(HttpMethod.Patch, $"api/appointments/{rebookedId}/confirm", status: 403);
    var receptionist = (await Send(HttpMethod.Post, "api/auth/login", new { username = "testreceptionist", password }))!["result"]!;
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", receptionist["accessToken"]!.GetValue<string>());
    var confirmed = (await Send(HttpMethod.Patch, $"api/appointments/{rebookedId}/confirm"))!["result"]!;
    Check(confirmed["status"]!.GetValue<string>() == "Confirmed", "Receptionist confirms a pending appointment");
    await Send(HttpMethod.Patch, $"api/appointments/{rebookedId}/confirm", status: 400);
    var rescheduled = (await Send(HttpMethod.Patch, $"api/appointments/{rebookedId}/reschedule", new { doctorId = 1, appointmentDate = dateText, startTime = "08:30:00" }))!["result"]!;
    Check(rescheduled["startTime"]!.GetValue<string>().StartsWith("08:30"), "Receptionist reschedules to an available slot");
    var cancelled = (await Send(HttpMethod.Patch, $"api/appointments/{rebookedId}/cancel"))!["result"]!;
    Check(cancelled["status"]!.GetValue<string>() == "Cancelled", "Receptionist cancels an appointment");

    var walkIn = (await Send(HttpMethod.Post, "api/appointments/direct", new
    {
        doctorId = 1, appointmentDate = dateText, startTime = "09:00:00",
        patientName = "Walk-in patient", patientPhone = "0912345000", reason = "Walk-in"
    }))!["result"]!;
    var walkInProfileId = walkIn["patientProfileId"]!.GetValue<int>();
    Check(walkIn["status"]!.GetValue<string>() == "Confirmed" && walkInProfileId > 0,
        "Walk-in creates a confirmed appointment and Patient profile");
    await Send(HttpMethod.Post, "api/appointments/direct", new
    {
        doctorId = 1, appointmentDate = dateText, startTime = "09:30:00",
        patientName = "Walk-in patient", patientPhone = "0912345000", reason = "Repeat walk-in"
    }, 409);
    var returningWalkIn = (await Send(HttpMethod.Post, "api/appointments/direct", new
    {
        doctorId = 1, appointmentDate = dateText, startTime = "09:30:00",
        patientProfileId = walkInProfileId, patientName = "Walk-in patient",
        patientPhone = "0912345000", reason = "Repeat walk-in"
    }))!["result"]!;
    Check(returningWalkIn["patientProfileId"]!.GetValue<int>() == walkInProfileId,
        "Returning walk-in reuses the matched Patient profile");

    db.Appointments.Add(new Appointment { DoctorId = 1, PatientId = savedPatient.UserId,
        PatientName = "Examination test", PatientPhone = "0901234567", AppointmentDate = DateTime.Today,
        StartTime = new TimeSpan(16, 0, 0), EndTime = new TimeSpan(16, 30, 0),
        Reason = "Examination", Status = "Confirmed", CreatedAt = DateTime.UtcNow });
    await db.SaveChangesAsync();
    var examinationId = await db.Appointments.Where(x => x.PatientName == "Examination test").Select(x => x.AppointmentId).SingleAsync();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", doctor["accessToken"]!.GetValue<string>());
    await Send(HttpMethod.Patch, $"api/appointments/{examinationId}/start-examination", status: 400);
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", receptionist["accessToken"]!.GetValue<string>());
    await Send(HttpMethod.Patch, $"api/appointments/{examinationId}/check-in",
        new { patientProfileId = 1, patientBookId = 1, bookPresented = true }, 400);
    var matchedPatient = (await Send(HttpMethod.Patch, $"api/appointments/{examinationId}/patient-profile",
        new { patientProfileId = (int?)null }))!["result"]!;
    var profileId = matchedPatient["patientProfileId"]!.GetValue<int>();
    var otherPatientBook = (await Send(HttpMethod.Post,
        $"api/patients/{walkInProfileId}/books/existing",
        new { bookNumber = "TEST-OTHER-001", bookPresented = true }))!["result"]!;
    await Send(HttpMethod.Patch, $"api/appointments/{examinationId}/check-in",
        new { patientProfileId = profileId,
            patientBookId = otherPatientBook["patientBookId"]!.GetValue<int>(), bookPresented = true }, 400);
    Check((await Send(HttpMethod.Get, "api/patients/matches?search=0901234567"))!["result"]!.AsArray()
        .Any(x => x!["patientId"]!.GetValue<int>() == profileId), "Receptionist can find the matched Patient profile");
    var bookInvoice = (await Send(HttpMethod.Post, $"api/patients/{profileId}/book-invoices",
        new { amount = 10000m }))!["result"]!;
    var invoiceId = bookInvoice["bookInvoiceId"]!.GetValue<int>();
    await Send(HttpMethod.Post, $"api/book-invoices/{invoiceId}/issue-book",
        new { bookNumber = "TEST-NEW-001" }, 409);
    await Send(HttpMethod.Patch, $"api/book-invoices/{invoiceId}/pay");
    var issuedBook = (await Send(HttpMethod.Post, $"api/book-invoices/{invoiceId}/issue-book",
        new { bookNumber = "TEST-NEW-001" }))!["result"]!;
    var issuedBookId = issuedBook["patientBookId"]!.GetValue<int>();
    await Send(HttpMethod.Post, $"api/book-invoices/{invoiceId}/issue-book",
        new { bookNumber = "TEST-NEW-002" }, 409);
    var checkedIn = (await Send(HttpMethod.Patch, $"api/appointments/{examinationId}/check-in",
        new { patientProfileId = profileId, patientBookId = issuedBookId, bookPresented = false }))!["result"]!;
    Check(checkedIn["patientBookId"]!.GetValue<int>() == issuedBookId
        && checkedIn["bookVerifiedAt"] != null && checkedIn["checkedInAt"] != null,
        "Check-in stores the issued book and verification time after Book invoice is Paid");
    await Send(HttpMethod.Patch, $"api/appointments/{examinationId}/check-in",
        new { patientProfileId = profileId, patientBookId = issuedBookId, bookPresented = false }, 400);
    var existingBook = (await Send(HttpMethod.Post, $"api/patients/{profileId}/books/existing",
        new { bookNumber = "TEST-OLD-001", bookPresented = true }))!["result"]!;
    db.Appointments.Add(new Appointment { DoctorId = 1, PatientId = savedPatient.UserId,
        PatientProfileId = profileId, PatientName = "Examination test", PatientPhone = "0901234567",
        AppointmentDate = DateTime.Today, StartTime = new TimeSpan(17, 0, 0),
        EndTime = new TimeSpan(17, 30, 0), Reason = "Existing book", Status = "Confirmed",
        CreatedAt = DateTime.UtcNow });
    await db.SaveChangesAsync();
    var existingAppointmentId = await db.Appointments.Where(x => x.Reason == "Existing book")
        .Select(x => x.AppointmentId).SingleAsync();
    var existingBookId = existingBook["patientBookId"]!.GetValue<int>();
    await Send(HttpMethod.Patch, $"api/appointments/{existingAppointmentId}/check-in",
        new { patientProfileId = profileId, patientBookId = existingBookId, bookPresented = false }, 400);
    await Send(HttpMethod.Patch, $"api/appointments/{existingAppointmentId}/check-in",
        new { patientProfileId = profileId, patientBookId = existingBookId, bookPresented = true });
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", doctor["accessToken"]!.GetValue<string>());
    await Send(HttpMethod.Patch, $"api/appointments/{examinationId}/start-examination");
    var disease = (await Send(HttpMethod.Post, "api/diseases", new { diseaseCode = "QA-D3", diseaseName = "Test diagnosis" }, 201))!["result"]!;
    var diseaseId = disease["diseaseId"]!.GetValue<int>();
    var recordRequest = new { appointmentId = examinationId, symptoms = "Fever", conclusion = "Observation", markCompleted = true,
        diagnoses = new[] { new { diseaseId, isPrimary = true } } };
    var record = (await Send(HttpMethod.Post, "api/medical-records", recordRequest, 201))!["result"]!;
    var recordId = record["medicalRecordId"]!.GetValue<int>();
    await Send(HttpMethod.Get, $"api/medical-records/by-appointment/{examinationId}");
    await Send(HttpMethod.Post, "api/medical-records", recordRequest, 409);
    await Send(HttpMethod.Put, $"api/medical-records/{recordId}", new { symptoms = "Improving", conclusion = "Stable", markCompleted = true,
        diagnoses = new[] { new { diseaseId, isPrimary = true } } });
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", patient["accessToken"]!.GetValue<string>());
    await Send(HttpMethod.Get, $"api/medical-records/{recordId}", status: 403);

    var secondPatient = (await Send(HttpMethod.Post, "api/auth/register", new { username = "otherpatient", password, fullName = "Other patient" }))!["result"]!;
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", admin["accessToken"]!.GetValue<string>());
    var testType = (await Send(HttpMethod.Post, "api/LabTestTypes", new { name = "Week3 blood test", price = 50000m }, 201))!;
    var testTypeId = testType["id"]!.GetValue<int>();
    await Send(HttpMethod.Post, "api/LabTests", new { patientId = savedPatient.UserId, labTestTypeId = testTypeId }, 403);
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", doctor["accessToken"]!.GetValue<string>());
    await Send(HttpMethod.Post, "api/LabTests", new { patientId = 2147483647, labTestTypeId = testTypeId }, 404);
    var labOrder = (await Send(HttpMethod.Post, "api/LabTests", new { patientId = savedPatient.UserId, labTestTypeId = testTypeId, clinicalDiagnosis = "Check blood" }))!;
    var labOrderId = labOrder["id"]!.GetValue<int>();
    Check(labOrder["doctorId"]!.GetValue<int>() == (await db.Users.SingleAsync(x => x.Username == "testdoctor")).UserId,
        "Lab order records the authenticated doctor");
    await Send(HttpMethod.Post, "api/LabTests/results", new { labTestId = labOrderId, resultSummary = "Normal" }, 403);
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", secondPatient["accessToken"]!.GetValue<string>());
    Check((await Send(HttpMethod.Get, "api/LabTests"))!.AsArray().Count == 0, "Other patient cannot list lab orders");
    await Send(HttpMethod.Get, $"api/LabTests/{labOrderId}", status: 404);
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", patient["accessToken"]!.GetValue<string>());
    Check((await Send(HttpMethod.Get, "api/LabTests"))!.AsArray().Count == 1, "Patient sees only own lab orders");
    var labTechnician = (await Send(HttpMethod.Post, "api/auth/login", new { username = "testlab", password }))!["result"]!;
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", labTechnician["accessToken"]!.GetValue<string>());
    Check((await Send(HttpMethod.Get, "api/LabTests/pending"))!.AsArray().Count == 1, "Lab technician sees pending tests");
    await Send(HttpMethod.Post, "api/LabTests/results", new { labTestId = labOrderId, resultSummary = "Normal" });
    await Send(HttpMethod.Post, "api/LabTests/results", new { labTestId = labOrderId, resultSummary = "Duplicate" }, 409);
    Check((await Send(HttpMethod.Get, "api/LabTests/pending"))!.AsArray().Count == 0, "Completed test leaves pending queue");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", patient["accessToken"]!.GetValue<string>());
    Check((await Send(HttpMethod.Get, $"api/LabTests/{labOrderId}"))!["result"]!["resultSummary"]!.GetValue<string>() == "Normal",
        "Patient can read their own completed lab result");
    await ScheduleReviewChecks.RunAsync(client, db, password, Check);
    await Week34Checks.RunAsync(client, db, password, Check);
    await RbacChecks.RunAsync(client, db, password, Check);
    var allTablesSeed = await File.ReadAllTextAsync(
        Path.Combine(root, "backend/ClinicManagement/Data/Seed/clinic-all-tables-demo.sql"));
    await db.Database.ExecuteSqlRawAsync(allTablesSeed);
    var firstSeedVersion = await db.Users.AsNoTracking().Where(x => x.Username == "admin")
        .Select(x => x.SecurityVersion).SingleAsync();
    client.DefaultRequestHeaders.Authorization = null;
    var firstSeedAdmin = (await Send(HttpMethod.Post, "api/auth/login",
        new { username = "admin", password = "admin123" }))!["result"]!;
    await db.Database.ExecuteSqlRawAsync(
        "INSERT INTO dbo.MedicineCategories (CategoryName) VALUES ('seed-should-delete-me')");
    Check(await db.MedicineCategories.AsNoTracking()
        .Where(x => x.CategoryName == "seed-should-delete-me")
        .Select(x => x.CategoryId).SingleAsync() == 1021,
        "Reset seed restarts generated IDs after the sample rows");
    await db.Database.ExecuteSqlRawAsync(allTablesSeed);
    db.ChangeTracker.Clear();
    Check(await db.Users.AsNoTracking().Where(x => x.Username == "admin")
        .Select(x => x.SecurityVersion).SingleAsync() == firstSeedVersion + 1,
        "Reset seed invalidates access tokens for reused demo account IDs");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
        "Bearer", firstSeedAdmin["accessToken"]!.GetValue<string>());
    await Send(HttpMethod.Get, "api/auth/me", status: 401);
    var staleRefresh = await Send(HttpMethod.Post, "api/auth/refresh",
        new { refreshToken = firstSeedAdmin["refreshToken"]!.GetValue<string>() }, 401);
    Check(staleRefresh!["code"]!.GetValue<int>() == 1002,
        "Reset seed rejects old refresh tokens with the normal 401 response");
    client.DefaultRequestHeaders.Authorization = null;
    Check(await db.Roles.CountAsync() == 20 && await db.Users.CountAsync() == 20
        && await db.RefreshTokens.CountAsync() == 20, "Reset seed creates accounts, roles and revoked tokens");
    Check(await db.Departments.CountAsync() == 20 && await db.Specializations.CountAsync() == 20
        && await db.Rooms.CountAsync() == 20 && await db.Doctors.CountAsync() == 20
        && await db.DoctorSchedules.CountAsync() == 20 && await db.TimeSlots.CountAsync() == 20
        && await db.Appointments.CountAsync() == 24, "Reset seed creates catalog and booking data");
    Check(await db.MedicineCategories.CountAsync() == 20 && await db.Suppliers.CountAsync() == 20
        && await db.Medicines.CountAsync() == 20 && await db.Inventory.CountAsync() == 20,
        "Reset seed creates the full pharmacy catalog and inventory");
    Check(await db.LabTestTypes.CountAsync() == 20 && await db.LabTests.CountAsync() == 25
        && await db.LabTestResults.CountAsync() == 20 && await db.LabTests.CountAsync(x => x.Status == "Pending") == 5,
        "Reset seed creates completed and pending lab workflows");
    Check(await db.Diseases.CountAsync() == 20 && await db.MedicalRecords.CountAsync() == 20
        && await db.RecordDiagnoses.CountAsync() == 20,
        "Reset seed creates diseases, examination records and diagnoses");
    var appliedMigrationsAfterSeed = await db.Database.GetAppliedMigrationsAsync();
    Check(!await db.Users.AnyAsync(x => x.Username == "testadmin")
        && !await db.MedicineCategories.AnyAsync(x => x.CategoryName == "seed-should-delete-me")
        && appliedMigrationsAfterSeed.Contains("20260926172919_AddLabTechnicianRole"),
        "Reset seed removes old application rows and preserves migration history");
    Check(await db.RefreshTokens.AllAsync(x => x.RevokedAt != null),
        "Demo refresh token rows cannot be used");
    Check(await db.LabTests.AllAsync(x => x.PatientId == 1004 || (x.PatientId >= 1006 && x.PatientId <= 1020)),
        "Seeded lab orders belong to patient accounts");
    var seededAdmin = (await Send(HttpMethod.Post, "api/auth/login",
        new { username = "admin", password = "admin123" }))!["result"]!;
    Check(seededAdmin["role"]!.GetValue<string>() == "Admin",
        "Seeded admin can sign in through the live API");
    var seededDoctor = (await Send(HttpMethod.Post, "api/auth/login",
        new { username = "demo_doctor", password = "admin123" }))!["result"]!;
    var seededReception = (await Send(HttpMethod.Post, "api/auth/login",
        new { username = "demo_reception", password = "admin123" }))!["result"]!;
    var seededPatient = (await Send(HttpMethod.Post, "api/auth/login",
        new { username = "demo_patient04", password = "admin123" }))!["result"]!;
    var seededTechnician = (await Send(HttpMethod.Post, "api/auth/login",
        new { username = "demo_labtech", password = "admin123" }))!["result"]!;
    Check(seededDoctor["role"]!.GetValue<string>() == "Doctor"
        && seededReception["role"]!.GetValue<string>() == "Receptionist"
        && seededPatient["role"]!.GetValue<string>() == "Patient"
        && seededTechnician["role"]!.GetValue<string>() == "LabTechnician",
        "All seeded demo accounts sign in with their intended roles");
    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", seededTechnician["accessToken"]!.GetValue<string>());
    Check((await Send(HttpMethod.Get, "api/LabTests/pending"))!.AsArray().Count == 5,
        "Seeded lab queue is available to the technician");
    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", seededPatient["accessToken"]!.GetValue<string>());
    var seededFutureDate = await db.DoctorSchedules.AsNoTracking().Where(x => x.DoctorId == 1005)
        .Select(x => x.WorkDate).SingleAsync();
    var seededSlots = (await Send(HttpMethod.Get,
        $"api/appointments/available-slots?doctorId=1005&date={seededFutureDate:yyyy-MM-dd}"))!["result"]!.AsArray();
    Check(seededSlots.Count == 1 && seededSlots[0]!["isAvailable"]!.GetValue<bool>(),
        "Seeded future schedule exposes a bookable slot");
    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", seededAdmin["accessToken"]!.GetValue<string>());
    var availableRoles = (await Send(HttpMethod.Get, "api/roles"))!["result"]!.AsArray();
    Check(availableRoles.Count == 20, "System and demo custom roles are available for assignment");
    await Send(HttpMethod.Patch, "api/users/1004/role", new { roleId = 5 });
    var assignedTechnician = (await Send(HttpMethod.Post, "api/auth/login",
        new { username = "demo_patient04", password = "admin123" }))!["result"]!;
    Check(assignedTechnician["role"]!.GetValue<string>() == "LabTechnician",
        "Admin can assign the lab technician role through the API");
    await Send(HttpMethod.Patch, "api/users/1004/role", new { roleId = 1007 });
    Check(!serverLog.Any(line => line.Contains("AuthService.RefreshAsync", StringComparison.Ordinal)
        || line.Contains("Failed to determine the https port", StringComparison.Ordinal)),
        "Expected refresh 401 and HTTP development profile do not emit server errors");
    Console.WriteLine($"SUCCESS: {checks} checks passed (weeks 2–4).");
}
catch
{
    Console.Error.WriteLine(string.Join('\n', serverLog.TakeLast(35)));
    throw;
}
finally
{
    if (server is { HasExited: false }) { server.Kill(entireProcessTree: true); await server.WaitForExitAsync(); }
    server?.Dispose();
    // This random database was created exclusively by this test run.
    await db.Database.EnsureDeletedAsync();
}

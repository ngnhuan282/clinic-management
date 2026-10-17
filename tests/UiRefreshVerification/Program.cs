using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Helpers;
using Microsoft.EntityFrameworkCore;

var directory = new DirectoryInfo(AppContext.BaseDirectory);
while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "backend", "ClinicManagement", "ClinicManagement.csproj")))
    directory = directory.Parent;
var root = directory?.FullName ?? throw new DirectoryNotFoundException("Repository root not found.");
var databaseName = "ClinicUiRefresh_" + Guid.NewGuid().ToString("N");
var connection = $"Server=(localdb)\\MSSQLLocalDB;Database={databaseName};Trusted_Connection=True;TrustServerCertificate=True";
await using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(connection).Options);
var password = "Fixture-" + Convert.ToHexString(RandomNumberGenerator.GetBytes(16));
var today = ClinicClock.Today;
var listener = new System.Net.Sockets.TcpListener(IPAddress.Loopback, 0);
listener.Start();
var port = ((IPEndPoint)listener.LocalEndpoint).Port;
listener.Stop();
using var http = new HttpClient(new HttpClientHandler { UseCookies = false })
    { BaseAddress = new Uri($"http://127.0.0.1:{port}/"), Timeout = TimeSpan.FromSeconds(30) };
Process? server = null;
var checks = 0;
void Check(bool condition, string description)
{
    if (!condition) throw new InvalidOperationException(description);
    checks++;
    Console.WriteLine("PASS " + description);
}
async Task<JsonNode?> Api(HttpMethod method, string path, object? payload = null, string? access = null, int expected = 200)
{
    using var request = new HttpRequestMessage(method, path);
    if (payload is not null) request.Content = JsonContent.Create(payload);
    if (access is not null) request.Headers.Authorization = new("Bearer", access);
    using var response = await http.SendAsync(request);
    if ((int)response.StatusCode != expected)
        throw new InvalidOperationException($"{method} {path}: expected {expected}, got {(int)response.StatusCode}.");
    var body = await response.Content.ReadAsStringAsync();
    if (string.IsNullOrWhiteSpace(body)) return null;
    var parsed = JsonNode.Parse(body);
    return parsed is JsonObject envelope && envelope.ContainsKey("result") && envelope.ContainsKey("code") ? envelope["result"] : parsed;
}
async Task<(int UserId, string Access)> Login(string username)
{
    var result = (await Api(HttpMethod.Post, "api/auth/login", new { username, password }))!;
    return (result["userId"]!.GetValue<int>(), result["accessToken"]!.GetValue<string>());
}
async Task<(int UserId, string Access)> Register(string username, string fullName, string phone)
{
    var result = (await Api(HttpMethod.Post, "api/auth/register", new { username, password, fullName, phone, email = username + "@fixture.example.test" }))!;
    return (result["userId"]!.GetValue<int>(), result["accessToken"]!.GetValue<string>());
}
object Schedule(int doctorId, int roomId, DateOnly date, int shift = 0) => new
{
    doctorId, roomId, workDate = date, shift,
    startTime = shift == 0 ? "08:00" : "13:30", endTime = shift == 0 ? "11:30" : "17:00",
    slotDurationMinutes = 30, maxCapacity = 1
};
try
{
    await db.Database.MigrateAsync();
    Check(!(await db.Database.GetPendingMigrationsAsync()).Any(), "Complete migration chain applies to a fresh LocalDB database");

    // The first Admin is the only bootstrap account; subsequent identities use registration and role APIs.
    db.Users.Add(new User { Username = "uiadmin", FullName = "Quản trị viên phòng khám", RoleId = await db.Roles.Where(x => x.RoleName == RoleConstants.Admin).Select(x => x.RoleId).SingleAsync(),
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), Email = "uiadmin@fixture.example.test", Phone = "0901000001", Status = true, CreatedAt = DateTime.UtcNow });
    await db.SaveChangesAsync();
    var start = new ProcessStartInfo("dotnet")
    {
        WorkingDirectory = Path.Combine(root, "backend", "ClinicManagement"), UseShellExecute = false,
        CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true
    };
    start.ArgumentList.Add(Path.Combine(AppContext.BaseDirectory, "ClinicManagement.dll"));
    start.Environment["ASPNETCORE_ENVIRONMENT"] = "Development";
    start.Environment["ASPNETCORE_URLS"] = http.BaseAddress!.ToString().TrimEnd('/');
    start.Environment["ConnectionStrings__DefaultConnection"] = connection;
    start.Environment["Jwt__Key"] = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
    start.Environment["AuthCookie__Secure"] = "false";
    start.Environment["Cors__FrontendUrl"] = "http://127.0.0.1:5190";
    start.Environment["Logging__LogLevel__Default"] = "Warning";
    server = Process.Start(start) ?? throw new InvalidOperationException("API process could not start.");
    // Drain server output without forwarding credentials, headers, or arbitrary server logs.
    server.OutputDataReceived += (_, _) => { };
    server.ErrorDataReceived += (_, _) => { };
    server.BeginOutputReadLine();
    server.BeginErrorReadLine();
    var ready = false;
    for (var index = 0; index < 150; index++)
    {
        if (server.HasExited) throw new InvalidOperationException($"API exited with code {server.ExitCode}.");
        try { if ((await http.GetAsync("swagger/v1/swagger.json")).IsSuccessStatusCode) { ready = true; break; } }
        catch (HttpRequestException) { }
        await Task.Delay(200);
    }
    Check(ready, "Real API starts from the referenced backend output");
    var admin = await Login("uiadmin");
    var patient = await Register("uipatient", "Nguyễn Thị Minh Anh", "0901000002");
    var other = await Register("uiother", "Trần Quốc Bảo", "0901000003");
    var staff = new Dictionary<string, (int UserId, string Access)>();
    var roles = (await Api(HttpMethod.Get, "api/roles", access: admin.Access))!.AsArray();
    foreach (var (username, fullName, role, phone) in new[]
    {
        ("uidoctor", "Bác sĩ Nguyễn Minh An", RoleConstants.Doctor, "0901000004"),
        ("uihead", "Trưởng khoa Trần Thu Hà", RoleConstants.DepartmentHead, "0901000005"),
        ("uiforeign", "Bác sĩ Lê Quang Huy", RoleConstants.Doctor, "0901000006"),
        ("uilab", "Kỹ thuật viên Phạm Thanh Mai", RoleConstants.LabTechnician, "0901000007")
    })
    {
        var registered = await Register(username, fullName, phone);
        var roleId = roles.Single(x => x!["roleName"]!.GetValue<string>() == role)!["roleId"]!.GetValue<int>();
        await Api(HttpMethod.Patch, $"api/users/{registered.UserId}/role", new { roleId }, admin.Access);
        staff[username] = await Login(username);
    }
    await Api(HttpMethod.Patch, "api/doctors/1/account", new { userId = staff["uidoctor"].UserId }, admin.Access);
    await Api(HttpMethod.Patch, "api/doctors/2/account", new { userId = staff["uihead"].UserId }, admin.Access);
    await Api(HttpMethod.Patch, "api/doctors/3/account", new { userId = staff["uiforeign"].UserId }, admin.Access);
    // No create-doctor API exists; this fixture-only profile exercises Admin self-review protection.
    var adminDoctor = new Doctor { FullName = "Quản trị viên kiêm bác sĩ", DepartmentId = 1, SpecializationId = 1, UserId = admin.UserId,
        Title = "BS.CKI", ExperienceYears = 10, IsActive = true };
    db.Doctors.Add(adminDoctor);
    await db.SaveChangesAsync();

    var scheduleIds = new List<string>();
    for (var day = 0; day < 7; day++)
        for (var doctorId = 1; doctorId <= 3; doctorId++)
            for (var shift = 0; shift <= 1; shift++)
            {
                var result = (await Api(HttpMethod.Post, "api/doctor-schedules", Schedule(doctorId, doctorId, today.AddDays(day), shift), admin.Access))!;
                scheduleIds.Add(result["scheduleId"]!.GetValue<string>());
            }
    var bookingDate = today.AddDays(30);
    await Api(HttpMethod.Post, "api/doctor-schedules", Schedule(1, 1, bookingDate), admin.Access);
    async Task<int> CreatePatientProfile((int UserId, string Access) session, string name, string phone, string time)
    {
        var appointment = (await Api(HttpMethod.Post, "api/appointments", new { doctorId = 1, appointmentDate = bookingDate.ToString("yyyy-MM-dd"), startTime = time,
            patientName = name, patientPhone = phone, reason = "Kiểm tra sức khỏe định kỳ" }, session.Access))!;
        await Api(HttpMethod.Patch, $"api/appointments/{appointment["appointmentId"]!.GetValue<int>()}/patient-profile", new { }, admin.Access);
        var profile = (await Api(HttpMethod.Get, "api/patients/me", access: session.Access))!;
        await Api(HttpMethod.Put, "api/patients/me", new { fullName = name, phone, birthDate = "1994-05-15", identityNumber = "UI" + session.UserId, insuranceCode = "DN4012345" + session.UserId }, session.Access);
        return profile["patientId"]!.GetValue<int>();
    }
    var patientProfileId = await CreatePatientProfile(patient, "Nguyễn Thị Minh Anh", "0901000002", "08:00:00");
    var otherProfileId = await CreatePatientProfile(other, "Trần Quốc Bảo", "0901000003", "08:30:00");
    Check(patientProfileId != otherProfileId, "Patient identities and profiles are created and retrieved through server APIs");

    var diseaseNames = new[] { "Viêm xoang cấp", "Viêm họng cấp", "Viêm phế quản", "Hen phế quản", "Rối loạn lipid máu", "Viêm dạ dày", "Trào ngược dạ dày thực quản", "Thiếu máu thiếu sắt", "Đau nửa đầu", "Viêm da tiếp xúc", "Viêm khớp dạng thấp", "Loãng xương", "Viêm tai giữa", "Suy giáp", "Viêm kết mạc", "Dị ứng theo mùa" };
    var diseaseIds = new List<int>();
    for (var index = 0; index < diseaseNames.Length; index++)
    {
        var result = (await Api(HttpMethod.Post, "api/diseases", new { diseaseCode = "UI-D" + (index + 1).ToString("00"), diseaseName = diseaseNames[index], description = "Danh mục chẩn đoán dùng trong khám và theo dõi điều trị." }, admin.Access, 201))!;
        diseaseIds.Add(result["diseaseId"]!.GetValue<int>());
    }
    await Api(HttpMethod.Delete, $"api/diseases/{diseaseIds[^1]}", access: admin.Access);

    var labNames = new[] { "Công thức máu toàn phần", "Đường huyết lúc đói", "Chức năng gan AST / ALT", "Chức năng thận", "Mỡ máu toàn phần", "Tổng phân tích nước tiểu", "Điện giải đồ", "Định lượng HbA1c", "CRP định lượng", "Hormone tuyến giáp TSH", "Vitamin D", "Ferritin huyết thanh", "Canxi máu", "Kháng nguyên viêm gan B" };
    var labTypeIds = new List<int>();
    for (var index = 0; index < labNames.Length; index++)
    {
        var result = (await Api(HttpMethod.Post, "api/LabTestTypes", new { name = labNames[index], price = 65000m + index * 25000m }, admin.Access, 201))!;
        labTypeIds.Add(result["id"]!.GetValue<int>());
    }
    await Api(HttpMethod.Delete, $"api/LabTestTypes/{labTypeIds[^1]}", access: admin.Access, expected: 204);

    var requestIds = new List<int>();
    for (var index = 0; index < 19; index++)
    {
        var result = (await Api(HttpMethod.Post, "api/doctor-schedules/request", Schedule(1, 1, today.AddDays(45 + index)), staff["uidoctor"].Access))!;
        var id = result["requestId"]!.GetValue<int>();
        requestIds.Add(id);
        if (index < 2) await Api(HttpMethod.Post, $"api/schedule-requests/{id}/approve", access: admin.Access);
        else if (index < 4) await Api(HttpMethod.Post, $"api/schedule-requests/{id}/reject", new { rejectReason = "Điều chỉnh ca theo kế hoạch của phòng khám." }, admin.Access);
    }
    var headRequest = (await Api(HttpMethod.Post, "api/doctor-schedules/request", Schedule(2, 2, today.AddDays(80)), staff["uihead"].Access))!;
    var headRejectRequest = (await Api(HttpMethod.Post, "api/doctor-schedules/request", Schedule(2, 2, today.AddDays(82)), staff["uihead"].Access))!;
    var ownRequest = new DoctorScheduleRequest { DoctorId = adminDoctor.DoctorId, RoomId = 1, WorkDate = today.AddDays(81),
        StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(11.5), Status = "Pending", CreatedAt = DateTime.UtcNow };
    db.DoctorScheduleRequests.Add(ownRequest);

    // Historical Completed appointments are isolated fixture rows, not claims that the check-in/examination module was tested.
    var historical = Enumerable.Range(0, 13).Select(index => new Appointment { DoctorId = index % 3 + 1, PatientId = patient.UserId, PatientProfileId = patientProfileId,
        PatientName = "Nguyễn Thị Minh Anh", PatientPhone = "0901000002", AppointmentDate = today.AddDays(-index - 1).ToDateTime(TimeOnly.MinValue),
        StartTime = TimeSpan.FromHours(9), EndTime = TimeSpan.FromHours(9.5), Reason = "Khám và theo dõi sức khỏe định kỳ", Status = "Completed", CreatedAt = DateTime.UtcNow.AddDays(-index - 1) }).ToArray();
    var foreignAppointment = new Appointment { DoctorId = 1, PatientId = other.UserId, PatientProfileId = otherProfileId,
        PatientName = "Trần Quốc Bảo", PatientPhone = "0901000003", AppointmentDate = today.AddDays(-20).ToDateTime(TimeOnly.MinValue),
        StartTime = TimeSpan.FromHours(10), EndTime = TimeSpan.FromHours(10.5), Reason = "Khám tổng quát", Status = "Completed", CreatedAt = DateTime.UtcNow.AddDays(-20) };
    db.Appointments.AddRange(historical);
    db.Appointments.Add(foreignAppointment);
    await db.SaveChangesAsync();
    var existingReview = (await Api(HttpMethod.Post, "api/reviews", new { appointmentId = historical[1].AppointmentId, rating = 5, comment = "Bác sĩ giải thích rõ ràng, tư vấn tận tình. Tôi rất hài lòng." }, patient.Access))!;
    var hiddenReview = (await Api(HttpMethod.Post, "api/reviews", new { appointmentId = historical[2].AppointmentId, rating = 4, comment = "Cảm ơn bác sĩ đã hướng dẫn chăm sóc sức khỏe." }, patient.Access))!;
    await Api(HttpMethod.Patch, $"api/reviews/{hiddenReview["reviewId"]!.GetValue<int>()}/visibility", new { isVisible = false }, admin.Access);
    var labTestIds = new List<int>();
    for (var index = 0; index < 16; index++)
    {
        var result = (await Api(HttpMethod.Post, "api/LabTests", new { patientId = patient.UserId, labTestTypeId = labTypeIds[index % 13], clinicalDiagnosis = "Kiểm tra chỉ số theo chỉ định khám sức khỏe." }, staff["uidoctor"].Access))!;
        var id = result["id"]!.GetValue<int>();
        labTestIds.Add(id);
        if (index < 14) await Api(HttpMethod.Post, "api/LabTests/results", new { labTestId = id, resultSummary = index == 0 ? "Hemoglobin: 135 g/L. Bạch cầu: 6,8 G/L. Tiểu cầu: 245 G/L." : "Các chỉ số trong giới hạn tham chiếu.", note = "Mang kết quả đến lần tái khám để bác sĩ tư vấn." }, staff["uilab"].Access);
    }
    var foreignLab = (await Api(HttpMethod.Post, "api/LabTests", new { patientId = other.UserId, labTestTypeId = labTypeIds[0], clinicalDiagnosis = "Kết quả của bệnh nhân khác" }, staff["uidoctor"].Access))!;
    var foreignLabId = foreignLab["id"]!.GetValue<int>();
    await Api(HttpMethod.Post, "api/LabTests/results", new { labTestId = foreignLabId, resultSummary = "Kết quả riêng của bệnh nhân khác." }, staff["uilab"].Access);

    foreach (var path in new[] { "api/auth/me", "api/patients/me", "api/LabTests", "api/LabTestTypes", "api/diseases", "api/schedule-requests", "api/reviews/my-appointments" })
        await Api(HttpMethod.Get, path, expected: 401);
    await Api(HttpMethod.Get, "api/auth/me", access: "invalid-ui-token", expected: 401);
    foreach (var path in new[] { "api/users", "api/diseases", "api/LabTestTypes", "api/schedule-requests" })
        await Api(HttpMethod.Get, path, access: patient.Access, expected: 403);
    Check(true, "Protected APIs return actual 401 for anonymous/invalid JWT and 403 for Patient missing rights");
    await Api(HttpMethod.Get, $"api/LabTests/{foreignLabId}", access: patient.Access, expected: 404);
    var ownLabs = (await Api(HttpMethod.Get, "api/LabTests", access: patient.Access))!.AsArray();
    Check(ownLabs.Count == 16 && ownLabs.All(x => x!["patientId"]!.GetValue<int>() == patient.UserId), "Lab API returns only current Patient's records and hides foreign detail");
    var ownDetail = (await Api(HttpMethod.Get, $"api/schedule-requests/{ownRequest.RequestId}", access: admin.Access))!;
    Check(!ownDetail["canReview"]!.GetValue<bool>(), "Admin contract marks own schedule request as not reviewable");
    await Api(HttpMethod.Post, $"api/schedule-requests/{ownRequest.RequestId}/approve", access: admin.Access, expected: 403);
    await Api(HttpMethod.Get, "api/schedule-requests?doctorId=1", access: staff["uihead"].Access, expected: 403);
    await Api(HttpMethod.Get, $"api/schedule-requests/{requestIds[0]}", access: staff["uihead"].Access, expected: 403);
    await Api(HttpMethod.Get, "api/doctor-schedules?doctorId=1", access: staff["uihead"].Access, expected: 403);
    await Api(HttpMethod.Get, $"api/doctor-schedules/{scheduleIds[0]}", access: staff["uihead"].Access, expected: 404);
    Check(true, "Admin cannot self-review and DepartmentHead cannot read foreign schedule/request filters or IDs");
    var pendingAppointmentId = (await db.Appointments.AsNoTracking().Where(x => x.PatientId == patient.UserId && x.Status == "Pending").Select(x => x.AppointmentId).FirstAsync());
    await Api(HttpMethod.Post, "api/reviews", new { appointmentId = pendingAppointmentId, rating = 5 }, patient.Access, 400);
    await Api(HttpMethod.Post, "api/reviews", new { appointmentId = foreignAppointment.AppointmentId, rating = 5 }, patient.Access, 403);
    await Api(HttpMethod.Post, "api/reviews", new { appointmentId = historical[1].AppointmentId, rating = 5 }, patient.Access, 409);
    var publicReviews = (await Api(HttpMethod.Get, "api/reviews?doctorId=3"))!;
    Check(publicReviews["totalItems"]!.GetValue<int>() == 0, "Review ownership/Completed/duplicate rules hold and hidden review stays absent from public API");
    Check(await db.Database.GetAppliedMigrationsAsync() is { } applied && applied.Any(), "Verification uses persisted migration history, without EnsureCreated");
    Console.WriteLine("UI_FIXTURE:" + JsonSerializer.Serialize(new
    {
        baseUrl = http.BaseAddress, password,
        usernames = new { admin = "uiadmin", patient = "uipatient", other = "uiother", doctor = "uidoctor", head = "uihead", lab = "uilab" },
        today = today.ToString("yyyy-MM-dd"), bookingDate = bookingDate.ToString("yyyy-MM-dd"), createScheduleDate = today.AddDays(7).ToString("yyyy-MM-dd"),
        doctorId = 1, doctorName = await db.Doctors.Where(x => x.DoctorId == 1).Select(x => x.FullName).SingleAsync(),
        departmentId = 1, departmentName = await db.Departments.Where(x => x.DepartmentId == 1).Select(x => x.Name).SingleAsync(),
        specializationId = 1, specializationName = await db.Specializations.Where(x => x.SpecializationId == 1).Select(x => x.Name).SingleAsync(),
        roomId = 1, roomName = await db.Rooms.Where(x => x.RoomId == 1).Select(x => x.Name).SingleAsync(),
        patientUserId = patient.UserId, otherUserId = other.UserId, patientProfileId, otherProfileId,
        scheduleIds, diseaseIds, labTypeIds, requestIds, ownRequestId = ownRequest.RequestId, headRequestId = headRequest["requestId"]!.GetValue<int>(), headRejectRequestId = headRejectRequest["requestId"]!.GetValue<int>(),
        eligibleAppointmentId = historical[0].AppointmentId, duplicateAppointmentId = historical[1].AppointmentId, pendingAppointmentId,
        foreignAppointmentId = foreignAppointment.AppointmentId, labTestIds, foreignLabId, checks,
        migrationCount = (await db.Database.GetAppliedMigrationsAsync()).Count()
    }));
    while (await Console.In.ReadLineAsync() is { } line)
    {
        if (string.IsNullOrWhiteSpace(line) || line == "stop") break;
        var command = JsonNode.Parse(line)?["command"]?.GetValue<string>();
        if (command == "stop") break;
        if (command == "state")
        {
            db.ChangeTracker.Clear();
            Console.WriteLine("UI_STATE:" + JsonSerializer.Serialize(new
            {
                schedules = await db.DoctorSchedules.CountAsync(), diseases = await db.Diseases.CountAsync(), labTypes = await db.LabTestTypes.CountAsync(),
                reviews = await db.Reviews.CountAsync(), pendingRequests = await db.DoctorScheduleRequests.CountAsync(x => x.Status == "Pending"),
                approvedRequests = await db.DoctorScheduleRequests.CountAsync(x => x.Status == "Approved"), rejectedRequests = await db.DoctorScheduleRequests.CountAsync(x => x.Status == "Rejected")
            }));
        }
    }
}
finally
{
    if (server is { HasExited: false })
    {
        server.Kill(entireProcessTree: true);
        await server.WaitForExitAsync();
    }
    server?.Dispose();
    // The generated name is fixed to our fixture prefix; only this disposable database is deleted.
    if (!databaseName.StartsWith("ClinicUiRefresh_", StringComparison.Ordinal))
        throw new InvalidOperationException("Unexpected fixture database name.");
    await db.Database.EnsureDeletedAsync();
    Console.WriteLine("UI_FIXTURE_CLEANUP: disposable database removed");
}

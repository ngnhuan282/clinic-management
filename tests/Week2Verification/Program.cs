using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json.Nodes;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;

var root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../"));
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
    await db.Database.MigrateAsync();
    Check(!(await db.Database.GetPendingMigrationsAsync()).Any(), "All migrations apply to an empty SQL Server database");
    Check(await db.Departments.CountAsync() == 3 && await db.Rooms.CountAsync() == 3 && await db.Specializations.CountAsync() == 3, "Catalog master data seeded");
    await db.Database.ExecuteSqlRawAsync(await File.ReadAllTextAsync(Path.Combine(root, "backend/ClinicManagement/Data/Seed/pharmacy-demo-data.sql")));
    Check(await db.Medicines.AnyAsync() && await db.Inventory.AnyAsync(), "Pharmacy demo seed works");
    foreach (var (name, role) in new[] { ("testadmin", 1), ("testdoctor", 2) })
        db.Users.Add(new User { Username = name, FullName = name, PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), RoleId = role, CreatedAt = DateTime.UtcNow });
    await db.SaveChangesAsync();

    var start = new ProcessStartInfo("dotnet") { WorkingDirectory = Path.Combine(root, "backend/ClinicManagement"), UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
    start.ArgumentList.Add(Path.Combine(root, "backend/ClinicManagement/bin/Debug/net8.0/ClinicManagement.dll"));
    start.Environment["ASPNETCORE_URLS"] = client.BaseAddress.ToString().TrimEnd('/');
    start.Environment["ASPNETCORE_ENVIRONMENT"] = "Development";
    start.Environment["ConnectionStrings__DefaultConnection"] = connection;
    start.Environment["Jwt__Key"] = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
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
    var slots = (await Send(HttpMethod.Get, $"api/appointments/available-slots?doctorId=1&date={dateText}"))!["result"]!.AsArray();
    Check(slots.Count == 13, "Availability comes from seeded working shifts");
    var schedule = await db.DoctorSchedules.FirstAsync(x => x.DoctorId == 1 && x.DayOfWeek == date.DayOfWeek);
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
    await Send(HttpMethod.Post, "api/appointments", body);
    await Send(HttpMethod.Post, "api/appointments", new { doctorId = 1, appointmentDate = dateText, startTime = "12:00:00", patientName = "Test", patientPhone = "0901234567", reason = "Invalid shift" }, 400);
    await Send(HttpMethod.Get, "api/appointments/available-slots?doctorId=1&date=2000-01-01", status: 400);
    Console.WriteLine($"SUCCESS: {checks} checks passed.");
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

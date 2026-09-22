using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json.Nodes;
using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore;

internal static class Week34Checks
{
    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password, Action<bool, string> check)
    {
        async Task<JsonNode?> Send(HttpMethod method, string path, object? body = null, int status = 200, string? token = null)
        {
            using var request = new HttpRequestMessage(method, path);
            if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            check((int)response.StatusCode == status, $"A3/A4 {method} {path.Split('?')[0]} expected {status}, got {(int)response.StatusCode}");
            var text = await response.Content.ReadAsStringAsync();
            return string.IsNullOrWhiteSpace(text) ? null : JsonNode.Parse(text);
        }
        async Task<JsonNode> Login(string username) => (await Send(HttpMethod.Post, "api/auth/login", new { username, password }))!["result"]!;
        static string Access(JsonNode session) => session["accessToken"]!.GetValue<string>();
        static string Refresh(JsonNode session) => session["refreshToken"]!.GetValue<string>();
        client.DefaultRequestHeaders.Authorization = null;
        var admin = await Login("testadmin");
        var adminToken = Access(admin);
        var adminId = admin["userId"]!.GetValue<int>();
        foreach (var path in new[] { "api/users", "api/roles", "api/auth/me", "api/test/internal" })
            await Send(HttpMethod.Get, path, status: 401);
        await Send(HttpMethod.Get, "api/test/token", status: 404);
        await Send(HttpMethod.Post, "api/test/database", status: 404);
        await Send(HttpMethod.Post, "hubs/notification/negotiate?negotiateVersion=1", status: 401);
        await Send(HttpMethod.Get, "api/users?access_token=" + adminToken, status: 401);

        var roleList = (await Send(HttpMethod.Get, "api/roles", token: adminToken))!["result"]!.AsArray();
        check(roleList.Count == 4, "Exactly four supported roles, no public role creation");
        var doctorRole = roleList.Single(x => x!["roleName"]!.GetValue<string>() == "Doctor")!["roleId"]!.GetValue<int>();
        var patientRole = roleList.Single(x => x!["roleName"]!.GetValue<string>() == "Patient")!["roleId"]!.GetValue<int>();
        var registered = (await Send(HttpMethod.Post, "api/auth/register", new
        {
            username = "accesspatient", fullName = "Access patient", password, roleId = 1, role = "Admin"
        }))!["result"]!;
        var userId = registered["userId"]!.GetValue<int>();
        check(registered["role"]!.GetValue<string>() == "Patient", "Public registration ignores supplied elevated role");
        var patientToken = Access(registered);
        var rawRefresh = Refresh(registered);
        foreach (var username in new[] { "accesspatient", "testdoctor", "testreceptionist" })
        {
            var session = await Login(username);
            await Send(HttpMethod.Get, "api/users", status: 403, token: Access(session));
            await Send(HttpMethod.Get, "api/roles", status: 403, token: Access(session));
            await Send(HttpMethod.Patch, $"api/users/{userId}/role", new { roleId = 1 }, 403, Access(session));
            await Send(HttpMethod.Patch, $"api/users/{userId}/status", new { status = false }, 403, Access(session));
            await Send(HttpMethod.Get, "api/test/internal", status: username == "accesspatient" ? 403 : 200, token: Access(session));
            await Send(HttpMethod.Get, "api/LabTestTypes", status: username == "testdoctor" ? 200 : 403, token: Access(session));
        }
        var page = (await Send(HttpMethod.Get, "api/users?search=accesspatient&pageSize=1", token: adminToken))!["result"]!;
        check(page["totalItems"]!.GetValue<int>() == 1 && page["items"]!.AsArray().Count == 1, "User search and pagination");
        var user = page["items"]![0]!;
        check(user["passwordHash"] == null && user["refreshToken"] == null && user["securityVersion"] == null, "User DTO does not expose credentials");
        await Send(HttpMethod.Get, $"api/users/{userId}", token: adminToken);
        await Send(HttpMethod.Get, "api/users/2147483647", status: 404, token: adminToken);
        await Send(HttpMethod.Patch, $"api/users/{userId}/role", new { roleId = 2147483647 }, 404, adminToken);
        await Send(HttpMethod.Patch, $"api/users/{userId}/role", new { roleId = 0 }, 400, adminToken);
        await Send(HttpMethod.Patch, $"api/users/{userId}/role", new { }, 400, adminToken);
        await Send(HttpMethod.Patch, $"api/users/{userId}/status", new { }, 400, adminToken);
        await Send(HttpMethod.Patch, $"api/users/{adminId}/role", new { roleId = patientRole }, 409, adminToken);
        await Send(HttpMethod.Patch, $"api/users/{adminId}/status", new { status = false }, 409, adminToken);
        await Send(HttpMethod.Post, "hubs/notification/negotiate?negotiateVersion=1", token: patientToken);
        using (var preflight = new HttpRequestMessage(HttpMethod.Options, "hubs/notification/negotiate"))
        {
            preflight.Headers.Add("Origin", "http://localhost:5173");
            preflight.Headers.Add("Access-Control-Request-Method", "POST");
            using var response = await client.SendAsync(preflight);
            check(response.Headers.TryGetValues("Access-Control-Allow-Credentials", out var values) && values.Contains("true"), "SignalR CORS supports credentials for configured origin");
        }

        using var socket = new ClientWebSocket();
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(20));
        var wsUrl = new UriBuilder(client.BaseAddress!) { Scheme = "ws", Path = "/hubs/notification", Query = "access_token=" + patientToken }.Uri;
        await socket.ConnectAsync(wsUrl, timeout.Token);
        await socket.SendAsync(Encoding.UTF8.GetBytes("{\"protocol\":\"json\",\"version\":1}\u001e"), WebSocketMessageType.Text, true, timeout.Token);
        var buffer = new byte[4096];
        var handshake = await socket.ReceiveAsync(buffer, timeout.Token);
        check(Encoding.UTF8.GetString(buffer, 0, handshake.Count).StartsWith("{}"), "Authenticated SignalR WebSocket completes handshake with query token");

        await Send(HttpMethod.Patch, $"api/users/{userId}/status", new { status = false }, token: adminToken);
        await Send(HttpMethod.Get, "api/auth/me", status: 401, token: patientToken);
        await Send(HttpMethod.Post, "api/auth/login", new { username = "accesspatient", password }, 403);
        await Send(HttpMethod.Post, "api/auth/refresh", new { refreshToken = rawRefresh }, 401);
        await Send(HttpMethod.Post, "hubs/notification/negotiate?negotiateVersion=1", status: 401, token: patientToken);
        check(await db.RefreshTokens.Where(x => x.UserId == userId).AllAsync(x => x.RevokedAt != null), "Lock revokes all refresh tokens for the account");
        var closed = false;
        try
        {
            while (!closed)
            {
                var frame = await socket.ReceiveAsync(buffer, timeout.Token);
                closed = frame.MessageType == WebSocketMessageType.Close || Encoding.UTF8.GetString(buffer, 0, frame.Count).Contains("\"type\":7");
            }
        }
        catch (WebSocketException) { closed = true; }
        check(closed, "Account lock closes an existing notification connection");
        await Send(HttpMethod.Patch, $"api/users/{userId}/status", new { status = true }, token: adminToken);
        await Send(HttpMethod.Get, "api/auth/me", status: 401, token: patientToken);
        await Send(HttpMethod.Post, "api/auth/refresh", new { refreshToken = rawRefresh }, 401);
        var unlocked = await Login("accesspatient");
        await Send(HttpMethod.Get, "api/auth/me", token: Access(unlocked));
        await Send(HttpMethod.Patch, $"api/users/{userId}/role", new { roleId = doctorRole }, token: adminToken);
        await Send(HttpMethod.Get, "api/auth/me", status: 401, token: Access(unlocked));
        await Send(HttpMethod.Post, "api/auth/refresh", new { refreshToken = Refresh(unlocked) }, 401);
        var promoted = await Login("accesspatient");
        check(promoted["role"]!.GetValue<string>() == "Doctor", "Login reflects assigned RoleId");
        await Send(HttpMethod.Get, "api/LabTestTypes", token: Access(promoted));
        await Send(HttpMethod.Post, "api/appointments", new { }, 403, Access(promoted));
        await Send(HttpMethod.Patch, $"api/users/{userId}/role", new { roleId = patientRole }, token: adminToken);
        await Send(HttpMethod.Get, "api/LabTestTypes", status: 401, token: Access(promoted));
        await Send(HttpMethod.Get, "api/auth/me", status: 401, token: patientToken);
        var finalSession = await Login("accesspatient");
        var concurrent = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ =>
            client.PostAsJsonAsync("api/auth/refresh", new { refreshToken = Refresh(finalSession) })));
        check(concurrent.Count(x => (int)x.StatusCode == 200) == 1 && concurrent.Count(x => (int)x.StatusCode == 401) == 3,
            "Concurrent refresh rotates exactly once");
        foreach (var response in concurrent) response.Dispose();
    }
}

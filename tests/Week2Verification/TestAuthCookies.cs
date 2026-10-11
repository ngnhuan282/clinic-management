using System.Runtime.CompilerServices;
using System.Text.Json.Nodes;

internal static class TestAuthCookies
{
    private sealed record Token(string Raw);
    private static readonly ConditionalWeakTable<JsonNode, Token> Tokens = new();
    public static void Capture(HttpResponseMessage response, JsonNode? envelope)
    {
        if (envelope is not JsonObject || envelope["result"] is not { } session || !response.Headers.TryGetValues("Set-Cookie", out var cookies)) return;
        var cookie = cookies.FirstOrDefault(x => x.StartsWith("clinic_refresh=", StringComparison.Ordinal));
        if (cookie is not null) Tokens.Add(session, new(cookie.Split(';')[0]["clinic_refresh=".Length..]));
    }
    public static string RawFor(JsonNode session) => Tokens.GetValue(session, _ => throw new Exception("Auth response did not set a refresh cookie")).Raw;
    public static object? Apply(HttpRequestMessage request, object? body)
    {
        if (request.RequestUri?.ToString() is "api/auth/refresh" or "api/auth/logout"
            && body?.GetType().GetProperty("refreshToken")?.GetValue(body) is string raw)
        {
            request.Headers.Add("Cookie", "clinic_refresh=" + raw);
            return null;
        }
        return body;
    }
}

using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;

namespace ClinicManagement.Configurations;

public class RefreshCookie(IConfiguration configuration, IHostEnvironment environment)
{
    public const string Name = "clinic_refresh";
    private CookieOptions Options(DateTime? expires = null)
    {
        var secure = configuration.GetValue("AuthCookie:Secure", true);
        var sameSite = configuration.GetValue("AuthCookie:SameSite", SameSiteMode.Lax);
        if ((!environment.IsDevelopment() && !secure) || (sameSite == SameSiteMode.None && !secure))
            throw new InvalidOperationException("Refresh cookies require Secure outside local development and for SameSite=None.");
        return new CookieOptions { HttpOnly = true, Secure = secure, SameSite = sameSite,
            Path = "/api/auth", Expires = expires, IsEssential = true };
    }

    public string Read(HttpRequest request) => request.Cookies[Name] ?? string.Empty;
    public void Write(HttpResponse response, AuthResponse result)
    {
        response.Headers.CacheControl = "no-store";
        response.Cookies.Append(Name, result.RefreshToken, Options(result.RefreshTokenExpiresAt));
    }
    public void Delete(HttpResponse response)
    {
        response.Headers.CacheControl = "no-store";
        response.Cookies.Delete(Name, Options());
    }

    public void ValidateOrigin(HttpRequest request)
    {
        if (!request.Headers.TryGetValue("Origin", out var origin)) return;
        var allowed = (configuration["Cors:FrontendUrl"] ?? "http://localhost:5173")
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).AsEnumerable();
        if (environment.IsDevelopment())
            allowed = allowed.Concat(Enumerable.Range(5173, 3).SelectMany(port => new[]
                { $"http://localhost:{port}", $"http://127.0.0.1:{port}" }));
        if (!allowed.Contains(origin.ToString(), StringComparer.OrdinalIgnoreCase))
            throw new AppException(ErrorCode.UNAUTHORIZED);
    }
}

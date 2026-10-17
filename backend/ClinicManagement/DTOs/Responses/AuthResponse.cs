namespace ClinicManagement.DTOs.Responses;

public class AuthResponse
{
    [System.Text.Json.Serialization.JsonIgnore]
    public string RefreshToken { get; set; } = string.Empty;
    [System.Text.Json.Serialization.JsonIgnore]
    public DateTime RefreshTokenExpiresAt { get; set; }
    public string AccessToken { get; set; } = string.Empty;

    public int UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;
    public IReadOnlyList<string> Permissions { get; set; } = [];
}

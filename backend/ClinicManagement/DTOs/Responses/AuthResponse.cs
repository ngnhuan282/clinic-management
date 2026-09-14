namespace ClinicManagement.DTOs.Responses;

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;

    public int UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;
}
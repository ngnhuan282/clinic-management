using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests.Auth;

public class RefreshTokenRequest
{
    [Required, StringLength(200)]
    public string RefreshToken { get; set; } = string.Empty;
}

using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class RefreshTokenRequest
{
    [Required, StringLength(200)]
    public string RefreshToken { get; set; } = string.Empty;
}

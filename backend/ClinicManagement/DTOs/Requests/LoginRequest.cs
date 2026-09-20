using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class LoginRequest
{
    [Required, StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, StringLength(72)]
    public string Password { get; set; } = string.Empty;
}

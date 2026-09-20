using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class RegisterRequest
{
    [Required, StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, StringLength(72, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [EmailAddress, StringLength(100)]
    public string? Email { get; set; }

    [Phone, StringLength(15)]
    public string? Phone { get; set; }
}

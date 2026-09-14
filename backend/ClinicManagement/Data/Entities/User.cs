namespace ClinicManagement.Data.Entities;

public class User
{
    public int UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public int RoleId { get; set; }

    public bool Status { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    // Navigation
    public Role Role { get; set; } = null!;
}
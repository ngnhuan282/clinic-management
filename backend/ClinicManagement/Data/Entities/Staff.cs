namespace ClinicManagement.Data.Entities;

public class Staff
{
    public int StaffId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int JobPositionId { get; set; }
    public JobPosition JobPosition { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public int? UserId { get; set; }
    public User? User { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

namespace ClinicManagement.DTOs.Responses.Staff;

public class StaffResponse
{
    public int StaffId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int JobPositionId { get; set; }
    public string JobPositionName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int? UserId { get; set; }
    public string? Username { get; set; }
}

namespace ClinicManagement.DTOs.Responses;

public class AdminDoctorResponse
{
    public int DoctorId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public string? Biography { get; set; }
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public int SpecializationId { get; set; }
    public string SpecializationName { get; set; } = string.Empty;
    public int? UserId { get; set; }
    public bool IsActive { get; set; }
}

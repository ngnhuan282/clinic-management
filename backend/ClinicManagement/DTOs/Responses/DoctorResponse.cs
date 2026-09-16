namespace ClinicManagement.DTOs.Responses;

public class DoctorResponse
{
    public int DoctorId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public int ExperienceYears { get; set; }

    public int DepartmentId { get; set; }

    public string DepartmentName { get; set; } = string.Empty;

    public string? Biography { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class AdminDoctorQuery : PaginationRequest
{
    [MaxLength(100)] public string? Search { get; set; }
    [Range(1, int.MaxValue)] public int? DepartmentId { get; set; }
}

public class CreateDoctorRequest
{
    [Required, MaxLength(100)] public string FullName { get; set; } = string.Empty;
    [Required, MaxLength(50)] public string Title { get; set; } = string.Empty;
    [Required, Range(0, 70)] public int? ExperienceYears { get; set; }
    [MaxLength(500)] public string? Biography { get; set; }
    [Range(1, int.MaxValue)] public int DepartmentId { get; set; }
    [Range(1, int.MaxValue)] public int SpecializationId { get; set; }
}

public class UpdateDoctorRequest
{
    [Required, MaxLength(100)] public string FullName { get; set; } = string.Empty;
    [Required, MaxLength(50)] public string Title { get; set; } = string.Empty;
    [Required, Range(0, 70)] public int? ExperienceYears { get; set; }
    [MaxLength(500)] public string? Biography { get; set; }
    [Range(1, int.MaxValue)] public int DepartmentId { get; set; }
    [Range(1, int.MaxValue)] public int SpecializationId { get; set; }
    public bool IsActive { get; set; } = true;
}

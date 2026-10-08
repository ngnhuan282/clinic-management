using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class PublicDoctorQuery : PaginationRequest
{
    [MaxLength(100)] public string? FullName { get; set; }
    [Range(1, int.MaxValue)] public int? DepartmentId { get; set; }
    [Range(1, int.MaxValue)] public int? RoomId { get; set; }
}

public class UpdateDoctorProfileRequest
{
    [Required, MaxLength(100)] public string FullName { get; set; } = string.Empty;
    [Required, MaxLength(50)] public string Title { get; set; } = string.Empty;
    [Required, Range(0, 70)] public int? ExperienceYears { get; set; }
    [MaxLength(500)] public string? Biography { get; set; }
}

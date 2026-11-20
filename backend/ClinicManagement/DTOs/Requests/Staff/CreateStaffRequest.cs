using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests.Staff;

public class CreateStaffRequest
{
    [Required, MaxLength(100)] public string FullName { get; set; } = string.Empty;
    [Range(1, int.MaxValue)] public int JobPositionId { get; set; }
}

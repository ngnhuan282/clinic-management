using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class PatientBookQuery : PaginationRequest
{
    [MaxLength(100)] public string? Search { get; set; }
    [MaxLength(20)] public string? Status { get; set; }
    [Range(1, int.MaxValue)] public int? PatientId { get; set; }
}

public class UpdatePatientBookStatusRequest
{
    [Required, MaxLength(20)] public string Status { get; set; } = string.Empty;
    [MaxLength(40)] public string? NewBookNumber { get; set; }
}

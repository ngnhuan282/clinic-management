using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class UpdatePatientProfileRequest
{
    [Required, MaxLength(100)] public string FullName { get; set; } = string.Empty;
    [Required, StringLength(15), Phone] public string Phone { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    [MaxLength(20)] public string? IdentityNumber { get; set; }
    [MaxLength(30)] public string? InsuranceCode { get; set; }
}

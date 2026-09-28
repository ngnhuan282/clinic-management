using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class CreateDirectAppointmentRequest : CreateAppointmentRequest
{
    [Range(1, int.MaxValue)]
    public int? PatientProfileId { get; set; }
    public DateTime? BirthDate { get; set; }

    [StringLength(20)]
    public string? IdentityNumber { get; set; }

    [StringLength(30)]
    public string? InsuranceCode { get; set; }
}

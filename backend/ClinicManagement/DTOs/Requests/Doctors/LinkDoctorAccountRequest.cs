using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests.Doctors;

public class LinkDoctorAccountRequest
{
    [Required, Range(1, int.MaxValue)] public int? UserId { get; set; }
}

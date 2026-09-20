using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class CreateAppointmentRequest
{
    public int DoctorId { get; set; }

    public DateTime AppointmentDate { get; set; }

    public TimeSpan StartTime { get; set; }

    [Required, StringLength(100)]
    public string PatientName { get; set; } = string.Empty;

    [Required, StringLength(15), Phone]
    public string PatientPhone { get; set; } = string.Empty;

    [Required, StringLength(500)]
    public string Reason { get; set; } = string.Empty;
}

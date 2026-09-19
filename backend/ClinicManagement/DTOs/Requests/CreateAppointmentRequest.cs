namespace ClinicManagement.DTOs.Requests;

public class CreateAppointmentRequest
{
    public int DoctorId { get; set; }

    public DateTime AppointmentDate { get; set; }

    public TimeSpan StartTime { get; set; }

    public string PatientName { get; set; } = string.Empty;

    public string PatientPhone { get; set; } = string.Empty;

    public string Reason { get; set; } = string.Empty;
}

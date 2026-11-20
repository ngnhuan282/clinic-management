namespace ClinicManagement.DTOs.Requests.Appointments;

public class RescheduleAppointmentRequest
{
    public int DoctorId { get; set; }

    public DateTime AppointmentDate { get; set; }

    public TimeSpan StartTime { get; set; }
}

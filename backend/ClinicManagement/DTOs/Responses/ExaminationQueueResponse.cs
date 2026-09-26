namespace ClinicManagement.DTOs.Responses;

public class ExaminationQueueResponse
{
    public int AppointmentId { get; set; }

    public int DoctorId { get; set; }

    public string DoctorName { get; set; } = string.Empty;

    public int? PatientId { get; set; }

    public string PatientName { get; set; } = string.Empty;

    public string PatientPhone { get; set; } = string.Empty;

    public DateTime AppointmentDate { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public string Reason { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public int? MedicalRecordId { get; set; }
}

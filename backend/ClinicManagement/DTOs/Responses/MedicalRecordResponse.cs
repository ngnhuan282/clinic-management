namespace ClinicManagement.DTOs.Responses;

public class MedicalRecordResponse
{
    public int MedicalRecordId { get; set; }

    public int AppointmentId { get; set; }

    public int DoctorId { get; set; }

    public string DoctorName { get; set; } = string.Empty;

    public int? PatientId { get; set; }

    public string PatientName { get; set; } = string.Empty;

    public string PatientPhone { get; set; } = string.Empty;

    public DateTime AppointmentDate { get; set; }

    public TimeSpan StartTime { get; set; }

    public string Symptoms { get; set; } = string.Empty;

    public string? Conclusion { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public IReadOnlyList<RecordDiagnosisResponse> Diagnoses { get; set; }
        = [];
}

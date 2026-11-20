namespace ClinicManagement.DTOs.Requests.Examinations;

public class CreateMedicalRecordRequest
{
    public int AppointmentId { get; set; }

    public string Symptoms { get; set; } = string.Empty;

    public decimal? Temperature { get; set; }

    public string? BloodPressure { get; set; }

    public decimal? WeightKg { get; set; }

    public decimal? HeightCm { get; set; }

    public string? Conclusion { get; set; }

    public int? PatientBookId { get; set; }

    public bool PaperBookConfirmed { get; set; }

    public bool MarkCompleted { get; set; }

    public List<SaveRecordDiagnosisRequest> Diagnoses { get; set; } = [];
}

namespace ClinicManagement.DTOs.Requests;

public class UpdateMedicalRecordRequest
{
    public string Symptoms { get; set; } = string.Empty;

    public string? Conclusion { get; set; }

    public bool MarkCompleted { get; set; }

    public List<SaveRecordDiagnosisRequest> Diagnoses { get; set; } = [];
}

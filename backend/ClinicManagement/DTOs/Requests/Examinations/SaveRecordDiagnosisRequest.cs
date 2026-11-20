namespace ClinicManagement.DTOs.Requests.Examinations;

public class SaveRecordDiagnosisRequest
{
    public int DiseaseId { get; set; }

    public bool IsPrimary { get; set; }

    public string? Note { get; set; }
}

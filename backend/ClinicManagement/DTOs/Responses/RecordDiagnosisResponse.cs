namespace ClinicManagement.DTOs.Responses;

public class RecordDiagnosisResponse
{
    public int RecordDiagnosisId { get; set; }

    public int DiseaseId { get; set; }

    public string DiseaseCode { get; set; } = string.Empty;

    public string DiseaseName { get; set; } = string.Empty;

    public bool IsPrimary { get; set; }

    public string? Note { get; set; }
}

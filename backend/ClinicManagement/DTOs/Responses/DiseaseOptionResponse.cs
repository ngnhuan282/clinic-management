namespace ClinicManagement.DTOs.Responses;

public class DiseaseOptionResponse
{
    public int DiseaseId { get; set; }

    public string DiseaseCode { get; set; } = string.Empty;

    public string DiseaseName { get; set; } = string.Empty;
}

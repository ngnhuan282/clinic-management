namespace ClinicManagement.DTOs.Requests;

public class CreateDiseaseRequest
{
    public string DiseaseCode { get; set; } = string.Empty;

    public string DiseaseName { get; set; } = string.Empty;

    public string? Description { get; set; }
}

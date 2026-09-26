namespace ClinicManagement.DTOs.Requests;

public class UpdateDiseaseRequest
{
    public string DiseaseCode { get; set; } = string.Empty;

    public string DiseaseName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}

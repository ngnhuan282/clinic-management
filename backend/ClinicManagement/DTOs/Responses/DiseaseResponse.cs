namespace ClinicManagement.DTOs.Responses;

public class DiseaseResponse
{
    public int DiseaseId { get; set; }

    public string DiseaseCode { get; set; } = string.Empty;

    public string DiseaseName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }
}

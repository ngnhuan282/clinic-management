namespace ClinicManagement.DTOs.Responses.Catalog;

public class DepartmentResponse
{
    public int DepartmentId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public SpecialtyInformation? PublicInformation { get; set; }
    public List<PublicSpecializationResponse> Specializations { get; set; } = [];
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed record SpecialtyInformation(string Overview, string[] FocusAreas,
    string[] Preparation, string? SourceUrl);

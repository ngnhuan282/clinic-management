namespace ClinicManagement.DTOs.Requests;

public class DiseaseFilterRequest : PaginationRequest
{
    public string? Search { get; set; }

    public bool IncludeInactive { get; set; }

    public bool? IsActive { get; set; }

    public string? SortBy { get; set; }

    public string? SortOrder { get; set; }
}

using ClinicManagement.DTOs.Requests.Shared;

namespace ClinicManagement.DTOs.Requests.Diseases;

public class DiseaseFilterRequest : PaginationRequest
{
    public string? Search { get; set; }

    public bool IncludeInactive { get; set; }

    public bool? IsActive { get; set; }

    public string? SortBy { get; set; }

    public string? SortOrder { get; set; }
}

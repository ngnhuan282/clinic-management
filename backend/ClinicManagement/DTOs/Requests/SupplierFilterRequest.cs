namespace ClinicManagement.DTOs.Requests;

public class SupplierFilterRequest : PaginationRequest
{
    public string? Search { get; set; }

    public string? UsageStatus { get; set; }

    public string? SortBy { get; set; }

    public string? SortOrder { get; set; }
}

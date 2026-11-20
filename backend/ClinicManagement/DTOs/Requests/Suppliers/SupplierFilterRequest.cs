using ClinicManagement.DTOs.Requests.Shared;

namespace ClinicManagement.DTOs.Requests.Suppliers;

public class SupplierFilterRequest : PaginationRequest
{
    public string? Search { get; set; }

    public string? UsageStatus { get; set; }

    public string? SortBy { get; set; }

    public string? SortOrder { get; set; }
}

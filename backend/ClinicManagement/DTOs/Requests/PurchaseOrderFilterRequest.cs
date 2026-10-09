namespace ClinicManagement.DTOs.Requests;

public class PurchaseOrderFilterRequest : PaginationRequest
{
    public string? Search { get; set; }

    public int? SupplierId { get; set; }

    public string? Status { get; set; }

    public DateOnly? FromDate { get; set; }

    public DateOnly? ToDate { get; set; }

    public string? SortBy { get; set; }

    public string? SortOrder { get; set; }
}

namespace ClinicManagement.DTOs.Requests;

public class MedicineFilterRequest : PaginationRequest
{
    public string? Search { get; set; }

    public int? CategoryId { get; set; }

    public int? SupplierId { get; set; }

    public string? StockStatus { get; set; }

    public string? SortBy { get; set; }

    public string? SortOrder { get; set; }
}

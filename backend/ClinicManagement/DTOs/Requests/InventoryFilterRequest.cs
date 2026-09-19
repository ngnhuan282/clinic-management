namespace ClinicManagement.DTOs.Requests;

public class InventoryFilterRequest : PaginationRequest
{
    public string? Search { get; set; }

    public int? MedicineId { get; set; }

    public int? CategoryId { get; set; }

    public int? SupplierId { get; set; }

    public string? StockStatus { get; set; }

    public string? SortBy { get; set; }

    public string? SortOrder { get; set; }
}

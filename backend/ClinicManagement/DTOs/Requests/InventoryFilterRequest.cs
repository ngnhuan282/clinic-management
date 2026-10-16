using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class InventoryFilterRequest : PaginationRequest
{
    [StringLength(200)]
    public string? Search { get; set; }

    [StringLength(50)]
    public string? BatchNumber { get; set; }

    public int? MedicineId { get; set; }

    public int? CategoryId { get; set; }

    public int? SupplierId { get; set; }

    public string? StockStatus { get; set; }

    [RegularExpression("^(InStock|LowStock|OutOfStock)$")]
    public string? StockLevel { get; set; }

    [RegularExpression("^(Valid|ExpiringSoon|Expired)$")]
    public string? ExpiryStatus { get; set; }

    public string? SortBy { get; set; }

    public string? SortOrder { get; set; }
}

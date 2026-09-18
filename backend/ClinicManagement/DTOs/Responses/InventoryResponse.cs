namespace ClinicManagement.DTOs.Responses;

public class InventoryResponse
{
    public int InventoryId { get; set; }

    public int MedicineId { get; set; }

    public string MedicineCode { get; set; } = string.Empty;

    public string MedicineName { get; set; } = string.Empty;

    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public int? SupplierId { get; set; }

    public string? SupplierName { get; set; }

    public string Unit { get; set; } = string.Empty;

    public decimal UnitPrice { get; set; }

    public string? Description { get; set; }

    public string BatchNumber { get; set; } = string.Empty;

    public int QuantityInStock { get; set; }

    public DateOnly ExpiryDate { get; set; }

    public int DaysUntilExpiry { get; set; }

    public string StockStatus { get; set; } = string.Empty;
}

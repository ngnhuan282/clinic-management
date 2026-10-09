using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class PurchaseOrderDetailRequest
{
    [Range(1, int.MaxValue)]
    public int MedicineId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(typeof(decimal), "0.01", "9999999999999999")]
    public decimal UnitPrice { get; set; }

    [Required]
    [MaxLength(50)]
    public string BatchNumber { get; set; } = string.Empty;

    public DateOnly ExpiryDate { get; set; }
}

public class CreatePurchaseOrderRequest
{
    [Range(1, int.MaxValue)]
    public int SupplierId { get; set; }

    public DateTime OrderDate { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    [Required]
    [MinLength(1)]
    public List<PurchaseOrderDetailRequest> Details { get; set; } = [];
}

public class UpdatePurchaseOrderRequest : CreatePurchaseOrderRequest
{
}

namespace ClinicManagement.DTOs.Responses;

public class PurchaseOrderDetailResponse
{
    public int PurchaseOrderDetailId { get; set; }

    public int MedicineId { get; set; }

    public string MedicineCode { get; set; } = string.Empty;

    public string MedicineName { get; set; } = string.Empty;

    public string Unit { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal LineTotal { get; set; }

    public string BatchNumber { get; set; } = string.Empty;

    public DateOnly ExpiryDate { get; set; }
}

public class PurchaseOrderResponse
{
    public int PurchaseOrderId { get; set; }

    public string PurchaseOrderCode { get; set; } = string.Empty;

    public int SupplierId { get; set; }

    public string SupplierName { get; set; } = string.Empty;

    public DateTime OrderDate { get; set; }

    public decimal TotalAmount { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public int ItemCount { get; set; }

    public int TotalQuantity { get; set; }

    public int CreatedByUserId { get; set; }

    public string CreatedByName { get; set; } = string.Empty;

    public int? ReceivedByUserId { get; set; }

    public string? ReceivedByName { get; set; }

    public DateTime? ReceivedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public IReadOnlyList<PurchaseOrderDetailResponse> Details { get; set; }
        = [];
}

public class PurchaseOrderSummaryResponse
{
    public int TotalOrders { get; set; }

    public int DraftOrders { get; set; }

    public int ReceivedOrders { get; set; }

    public int CancelledOrders { get; set; }

    public decimal ReceivedValueThisMonth { get; set; }
}

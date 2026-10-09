namespace ClinicManagement.Data.Entities;

public class PurchaseOrder
{
    public int PurchaseOrderId { get; set; }

    public int SupplierId { get; set; }

    public Supplier Supplier { get; set; } = null!;

    public DateTime OrderDate { get; set; }

    public decimal TotalAmount { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public int CreatedByUserId { get; set; }

    public User CreatedByUser { get; set; } = null!;

    public int? ReceivedByUserId { get; set; }

    public User? ReceivedByUser { get; set; }

    public DateTime? ReceivedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<PurchaseOrderDetail> Details { get; set; }
        = new List<PurchaseOrderDetail>();
}

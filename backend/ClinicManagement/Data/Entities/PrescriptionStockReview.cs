namespace ClinicManagement.Data.Entities;

public class PrescriptionStockReview
{
    public int PrescriptionStockReviewId { get; set; }
    public int PrescriptionId { get; set; }
    public Prescription Prescription { get; set; } = null!;
    public string Status { get; set; } = "Pending";
    public string Note { get; set; } = string.Empty;
    public string ShortagesJson { get; set; } = "[]";
    public string RecipientsJson { get; set; } = "[]";
    public int? InvoiceId { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<PrescriptionStockReviewDecision> Decisions { get; set; } = [];
    public int? ResolvedByUserId { get; set; }
    public User? ResolvedByUser { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

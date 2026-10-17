namespace ClinicManagement.Data.Entities;

public class PrescriptionStockReviewDecision
{
    public int PrescriptionStockReviewDecisionId { get; set; }
    public int PrescriptionStockReviewId { get; set; }
    public PrescriptionStockReview Review { get; set; } = null!;
    public int DoctorUserId { get; set; }
    public User DoctorUser { get; set; } = null!;
    public string Action { get; set; } = string.Empty;
    public string Outcome { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string BeforeJson { get; set; } = string.Empty;
    public string AfterJson { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

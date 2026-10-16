namespace ClinicManagement.DTOs.Responses;

public record StockReviewRecipientResponse(int UserId, string FullName, string Department);
public record StockReviewShortageResponse(int MedicineId, string MedicineName, string Unit,
    int QuantityPrescribed, int QuantityAvailable, int QuantityShort);

public class StockReviewResponse
{
    public int ReviewId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string WorkflowStatus { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public int? InvoiceId { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public IReadOnlyList<StockReviewDecisionResponse> Decisions { get; set; } = [];
    public string? ResolvedByName { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public IReadOnlyList<StockReviewShortageResponse> Shortages { get; set; } = [];
    public IReadOnlyList<StockReviewRecipientResponse> Recipients { get; set; } = [];
}

public record StockReviewPrescriptionItem(int MedicineId, string MedicineName, string Unit,
    int Quantity, string Dosage, string Instructions);
public record StockReviewPrescriptionSnapshot(string? Notes, IReadOnlyList<StockReviewPrescriptionItem> Details);
public record StockReviewDecisionResponse(int DecisionId, string Action, string Outcome, string Reason,
    string DoctorName, DateTime CreatedAt, StockReviewPrescriptionSnapshot Before, StockReviewPrescriptionSnapshot After);

public class DoctorStockReviewResponse
{
    public StockReviewResponse Review { get; set; } = null!;
    public PrescriptionResponse Prescription { get; set; } = null!;
    public DateTime PrescriptionUpdatedAt { get; set; }
    public bool HasMedicineInvoice { get; set; }
    public bool CanRespond { get; set; }
}

public record DoctorStockReviewListItem(int ReviewId, int PrescriptionId, string PrescriptionCode,
    string PatientName, string PatientPhone, string Status, string? LastOutcome,
    string CreatedByName, DateTime CreatedAt, int ShortageItems, string WorkflowStatus);

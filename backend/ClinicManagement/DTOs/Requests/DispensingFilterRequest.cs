using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class DispensingFilterRequest : PaginationRequest
{
    [StringLength(200)]
    public string? Search { get; set; }

    [RegularExpression("^(Ready|AwaitingPayment|Dispensed|NeedsReview)$")]
    public string? WorkflowStatus { get; set; }

    [RegularExpression("^(Paid|Unpaid)$")]
    public string? PaymentStatus { get; set; }

    [RegularExpression("^(NotRequested|Pending|Resolved)$")]
    public string? ReviewStatus { get; set; }

    public DateOnly? FromDate { get; set; }

    public DateOnly? ToDate { get; set; }
}

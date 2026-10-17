using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class DoctorStockReviewFilterRequest : PaginationRequest
{
    [StringLength(200)]
    public string? Search { get; set; }
    [RegularExpression("^(Pending|Resolved|StillShortage)$")]
    public string? Status { get; set; } = "Pending";
}

public class RespondStockReviewRequest : UpdatePrescriptionRequest
{
    [Required, RegularExpression("^(KeepPrescription|AdjustPrescription)$")]
    public string Action { get; set; } = string.Empty;
    [Required, StringLength(2000, MinimumLength = 3)]
    public string Reason { get; set; } = string.Empty;
    [Required]
    public DateTime? ExpectedReviewUpdatedAt { get; set; }
    [Required]
    public DateTime? ExpectedPrescriptionUpdatedAt { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class RecheckStockReviewRequest
{
    [Range(1, int.MaxValue)]
    public int ExpectedReviewId { get; set; }
    [Required]
    public DateTime? ExpectedReviewUpdatedAt { get; set; }
    [Required]
    public DateTime? ExpectedPrescriptionUpdatedAt { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class CreateStockReviewRequest
{
    [Required, StringLength(2000, MinimumLength = 3)]
    public string Note { get; set; } = string.Empty;

    [Required]
    public DateTime? ExpectedUpdatedAt { get; set; }
}

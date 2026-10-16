using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class MedicalHistoryFilterRequest : PaginationRequest
{
    [StringLength(200)]
    public string? Search { get; set; }

    public DateTime? FromDate { get; set; }

    public DateTime? ToDate { get; set; }
}

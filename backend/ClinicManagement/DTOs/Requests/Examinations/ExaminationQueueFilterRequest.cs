using ClinicManagement.DTOs.Requests.Shared;

namespace ClinicManagement.DTOs.Requests.Examinations;

public class ExaminationQueueFilterRequest : PaginationRequest
{
    public DateTime? Date { get; set; }

    public int? DoctorId { get; set; }

    public string? Search { get; set; }

    public string? Status { get; set; }

    public string? Shift { get; set; }
}

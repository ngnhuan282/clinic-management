namespace ClinicManagement.DTOs.Requests;

public class ExaminationQueueFilterRequest : PaginationRequest
{
    public DateTime? Date { get; set; }

    public int? DoctorId { get; set; }

    public string? Search { get; set; }

    public string? Status { get; set; }

    public string? Shift { get; set; }
}

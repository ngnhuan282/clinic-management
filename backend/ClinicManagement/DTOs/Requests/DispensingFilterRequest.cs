namespace ClinicManagement.DTOs.Requests;

public class DispensingFilterRequest : PaginationRequest
{
    public string? Search { get; set; }

    public string? WorkflowStatus { get; set; }

    public DateOnly? FromDate { get; set; }

    public DateOnly? ToDate { get; set; }
}

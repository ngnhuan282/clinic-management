namespace ClinicManagement.DTOs.Requests;

public class StaffQuery : PaginationRequest
{
    public string? Search { get; set; }
    public int? JobPositionId { get; set; }
}

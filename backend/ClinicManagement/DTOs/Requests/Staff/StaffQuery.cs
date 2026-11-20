using ClinicManagement.DTOs.Requests.Shared;

namespace ClinicManagement.DTOs.Requests.Staff;

public class StaffQuery : PaginationRequest
{
    public string? Search { get; set; }
    public int? JobPositionId { get; set; }
}

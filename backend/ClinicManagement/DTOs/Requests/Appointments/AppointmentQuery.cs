using ClinicManagement.DTOs.Requests.Shared;

namespace ClinicManagement.DTOs.Requests.Appointments;

public class AppointmentQuery : PaginationRequest
{
    public string? Search { get; set; }

    public string? Status { get; set; }

    public DateTime? DateFrom { get; set; }

    public DateTime? DateTo { get; set; }

    public int? DoctorId { get; set; }
}

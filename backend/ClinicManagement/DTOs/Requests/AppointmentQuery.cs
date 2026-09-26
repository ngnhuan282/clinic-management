namespace ClinicManagement.DTOs.Requests;

public class AppointmentQuery : PaginationRequest
{
    public string? Search { get; set; }

    public string? Status { get; set; }

    public DateTime? DateFrom { get; set; }

    public DateTime? DateTo { get; set; }

    public int? DoctorId { get; set; }
}

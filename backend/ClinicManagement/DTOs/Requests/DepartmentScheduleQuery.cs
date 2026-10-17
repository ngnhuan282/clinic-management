namespace ClinicManagement.DTOs.Requests;

public class DepartmentScheduleQuery : PaginationRequest
{
    public DateOnly? Date { get; set; }
    public DateOnly? WeekStart { get; set; }
    public int? DoctorId { get; set; }
    public int? RoomId { get; set; }
}

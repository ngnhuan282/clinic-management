using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class DoctorScheduleQuery : DepartmentScheduleQuery
{
    [Range(1, int.MaxValue)] public int? SpecializationId { get; set; }
}

public class ScheduleRequestQuery : PaginationRequest
{
    public string? Status { get; set; }
    [Range(1, int.MaxValue)] public int? DoctorId { get; set; }
    [Range(1, int.MaxValue)] public int? RoomId { get; set; }
}

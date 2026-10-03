namespace ClinicManagement.DTOs.Responses;

public class ScheduleRequestResponse
{
    public int RequestId { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public int RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public DateOnly WorkDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? ReviewerId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool CanReview { get; set; }
    public List<ScheduleConflictResponse> Conflicts { get; set; } = [];
    public bool IsConflict => Conflicts.Count > 0;
    public string? ConflictDetails => IsConflict
        ? string.Join(", ", Conflicts.Select(x => x.Type == "Doctor" ? $"trùng bác sĩ {x.DoctorName}" : $"trùng phòng {x.RoomName}"))
        : null;
}

public class ScheduleConflictResponse
{
    public string Type { get; set; } = string.Empty;
    public int RequestId { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public int RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public DateOnly WorkDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}

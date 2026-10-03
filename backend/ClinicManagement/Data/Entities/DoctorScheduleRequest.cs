namespace ClinicManagement.Data.Entities;

public class DoctorScheduleRequest
{
    public int RequestId { get; set; }
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;
    public DateOnly WorkDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int RoomId { get; set; }
    public Room Room { get; set; } = null!;
    public string Status { get; set; } = "Pending";
    public int? ReviewerId { get; set; }
    public User? Reviewer { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DoctorSchedule? Schedule { get; set; }
}

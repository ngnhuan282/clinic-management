namespace ClinicManagement.Data.Entities;

public class TimeSlot
{
    public Guid SlotId { get; set; } = Guid.NewGuid();
    public Guid ScheduleId { get; set; }
    public DoctorSchedule Schedule { get; set; } = null!;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int MaxCapacity { get; set; } = 1;
    public int CurrentBooked { get; set; }
    public bool IsAvailable { get; set; } = true;
}

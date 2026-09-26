namespace ClinicManagement.Data.Entities;

public class DoctorSchedule
{
    public Guid ScheduleId { get; set; } = Guid.NewGuid();
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;
    public int RoomId { get; set; }
    public Room Room { get; set; } = null!;
    public DateOnly WorkDate { get; set; }
    public Shift Shift { get; set; }
    public int MaxPatients { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public ICollection<TimeSlot> TimeSlots { get; set; } = [];
}

public enum Shift
{
    Morning,
    Afternoon,
    Evening
}

using ClinicManagement.Data.Entities;

namespace ClinicManagement.DTOs.Responses;

public class DoctorScheduleResponse
{
    public Guid ScheduleId { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public int RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public DateOnly WorkDate { get; set; }
    public Shift Shift { get; set; }
    public int MaxPatients { get; set; }
    public bool IsActive { get; set; }
    public int TotalSlots { get; set; }
    public int BookedSlots { get; set; }
    public List<TimeSlotResponse> TimeSlots { get; set; } = [];
}

public class TimeSlotResponse
{
    public Guid SlotId { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public int MaxCapacity { get; set; }
    public int CurrentBooked { get; set; }
    public bool IsAvailable { get; set; }
}

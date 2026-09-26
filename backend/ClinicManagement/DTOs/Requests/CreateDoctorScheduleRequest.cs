using ClinicManagement.Data.Entities;

namespace ClinicManagement.DTOs.Requests;

public class CreateDoctorScheduleRequest
{
    public int DoctorId { get; set; }
    public int RoomId { get; set; }
    public DateOnly WorkDate { get; set; }
    public Shift Shift { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public int SlotDurationMinutes { get; set; }
    public int MaxCapacity { get; set; } = 1;
}

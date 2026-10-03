namespace ClinicManagement.DTOs.Responses;

public class AvailableSlotResponse
{
    public Guid SlotId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string SpecializationName { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsAvailable { get; set; }
}

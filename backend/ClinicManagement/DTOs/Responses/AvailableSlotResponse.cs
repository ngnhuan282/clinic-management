namespace ClinicManagement.DTOs.Responses;

public class AvailableSlotResponse
{
    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public bool IsAvailable { get; set; }
}

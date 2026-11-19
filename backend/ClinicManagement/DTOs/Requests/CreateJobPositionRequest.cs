namespace ClinicManagement.DTOs.Requests;

public class CreateJobPositionRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

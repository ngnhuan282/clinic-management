namespace ClinicManagement.DTOs.Requests;

public class CreateSpecializationRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DepartmentId { get; set; }
}

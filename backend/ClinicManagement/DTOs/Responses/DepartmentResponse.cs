namespace ClinicManagement.DTOs.Responses;

public class DepartmentResponse
{
    public int DepartmentId { get; set; }

    public string DepartmentName { get; set; } = string.Empty;

    public string? Description { get; set; }
}

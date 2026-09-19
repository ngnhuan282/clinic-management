namespace ClinicManagement.DTOs.Requests;

public class UpdateDepartmentRequest : CreateDepartmentRequest
{
    public bool IsActive { get; set; } = true;
}

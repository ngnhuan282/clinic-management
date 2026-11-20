namespace ClinicManagement.DTOs.Requests.Catalog;

public class UpdateDepartmentRequest : CreateDepartmentRequest
{
    public bool IsActive { get; set; } = true;
}

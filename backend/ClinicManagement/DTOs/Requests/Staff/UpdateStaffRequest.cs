namespace ClinicManagement.DTOs.Requests.Staff;

public class UpdateStaffRequest : CreateStaffRequest
{
    public bool IsActive { get; set; } = true;
}

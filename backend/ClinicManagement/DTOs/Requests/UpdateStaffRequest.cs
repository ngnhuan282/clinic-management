namespace ClinicManagement.DTOs.Requests;

public class UpdateStaffRequest : CreateStaffRequest
{
    public bool IsActive { get; set; } = true;
}

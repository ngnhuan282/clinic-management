namespace ClinicManagement.DTOs.Requests;

public class UpdateSpecializationRequest : CreateSpecializationRequest
{
    public bool IsActive { get; set; } = true;
}

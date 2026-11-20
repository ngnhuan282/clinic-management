namespace ClinicManagement.DTOs.Requests.Catalog;

public class UpdateSpecializationRequest : CreateSpecializationRequest
{
    public bool IsActive { get; set; } = true;
}

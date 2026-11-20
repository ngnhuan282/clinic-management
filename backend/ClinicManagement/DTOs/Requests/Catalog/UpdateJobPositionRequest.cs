namespace ClinicManagement.DTOs.Requests.Catalog;

public class UpdateJobPositionRequest : CreateJobPositionRequest
{
    public bool IsActive { get; set; } = true;
}

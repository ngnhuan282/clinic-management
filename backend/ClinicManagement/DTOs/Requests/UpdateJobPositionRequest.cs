namespace ClinicManagement.DTOs.Requests;

public class UpdateJobPositionRequest : CreateJobPositionRequest
{
    public bool IsActive { get; set; } = true;
}

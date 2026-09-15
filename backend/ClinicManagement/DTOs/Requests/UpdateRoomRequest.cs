namespace ClinicManagement.DTOs.Requests;

public class UpdateRoomRequest : CreateRoomRequest
{
    public bool IsActive { get; set; } = true;
}

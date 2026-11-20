namespace ClinicManagement.DTOs.Requests.Catalog;

public class UpdateRoomRequest : CreateRoomRequest
{
    public bool IsActive { get; set; } = true;
}

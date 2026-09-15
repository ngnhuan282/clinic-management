namespace ClinicManagement.DTOs.Requests;

public class CreateRoomRequest
{
    public string RoomNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? RoomType { get; set; }
    public int DepartmentId { get; set; }
    public string? Location { get; set; }
}

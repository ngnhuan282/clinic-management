namespace ClinicManagement.DTOs.Responses;

public class PublicDoctorResponse
{
    public int DoctorId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string? Biography { get; set; }
    public List<DoctorRoomResponse> Rooms { get; set; } = [];
}

public class DoctorRoomResponse
{
    public int RoomId { get; set; }
    public string RoomCode { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
}

public class DoctorProfileResponse
{
    public int DoctorId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public string? Biography { get; set; }
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string SpecializationName { get; set; } = string.Empty;
}

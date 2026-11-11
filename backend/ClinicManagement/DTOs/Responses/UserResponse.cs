namespace ClinicManagement.DTOs.Responses;

public record UserResponse(int UserId, string Username, string FullName, string? Email,
    string? Phone, int RoleId, string Role, bool Status, DateTime CreatedAt)
{
    public IReadOnlyList<string>? Permissions { get; init; }
    public int? DoctorId { get; init; }
    public string? DoctorName { get; init; }
    public string? DepartmentName { get; init; }
}

public record RoleResponse(int RoleId, string RoleName, string? Description, bool IsSystem = false);

public record UserRoleCountResponse(int RoleId, string Role, int Total, int Active);
public record UserSummaryResponse(int Total, int Active, int Locked, IReadOnlyList<UserRoleCountResponse> Roles);
public record AccountDoctorResponse(int DoctorId, int? UserId, string FullName,
    string DepartmentName, string SpecializationName);

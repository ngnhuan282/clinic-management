namespace ClinicManagement.DTOs.Responses;

public record UserResponse(int UserId, string Username, string FullName, string? Email,
    string? Phone, int RoleId, string Role, bool Status, DateTime CreatedAt);

public record RoleResponse(int RoleId, string RoleName, string? Description);

using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ClinicManagement.DTOs.Requests;

public class UserQuery : PaginationRequest
{
    [MaxLength(100)] public string? Search { get; set; }
    [Range(1, int.MaxValue)] public int? RoleId { get; set; }
    public bool? Status { get; set; }
}

public class UpdateUserRoleRequest
{
    [Required, Range(1, int.MaxValue)] public int? RoleId { get; set; }
}

public class UpdateUserStatusRequest
{
    [Required] public bool? Status { get; set; }
}

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdateUserProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
}

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class CreateStaffUserRequest : UpdateUserProfileRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public int? DoctorId { get; set; }
}

public sealed class AvailableDoctorQuery : PaginationRequest
{
    [MaxLength(100)] public string? Search { get; set; }
}

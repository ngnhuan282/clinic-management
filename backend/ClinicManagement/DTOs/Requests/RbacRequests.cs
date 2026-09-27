using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class RoleQuery : PaginationRequest
{
    [MaxLength(100)] public string? Search { get; set; }
    public bool? IsSystem { get; set; }
}

public class CreateRoleRequest
{
    [Required, StringLength(50, MinimumLength = 2)] public string Name { get; set; } = string.Empty;
    [Required, StringLength(200, MinimumLength = 2)] public string Description { get; set; } = string.Empty;
    public int? CopyFromRoleId { get; set; }
    public List<string>? PermissionCodes { get; set; }
}

public class UpdateRoleRequest
{
    [Required, StringLength(50, MinimumLength = 2)] public string Name { get; set; } = string.Empty;
    [Required, StringLength(200, MinimumLength = 2)] public string Description { get; set; } = string.Empty;
    [Required] public string Version { get; set; } = string.Empty;
}

public class UpdateRolePermissionsRequest
{
    [Required] public List<string> PermissionCodes { get; set; } = [];
    [Required] public string Version { get; set; } = string.Empty;
}

public class DeleteRoleRequest
{
    [Required] public string Version { get; set; } = string.Empty;
}

public class RbacAuditQuery : PaginationRequest
{
    public int? EntityId { get; set; }
    [MaxLength(40)] public string? EntityType { get; set; }
}

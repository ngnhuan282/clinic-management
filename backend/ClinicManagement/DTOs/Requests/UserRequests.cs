using System.ComponentModel.DataAnnotations;

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

namespace ClinicManagement.Data.Entities;

public class RolePermission
{
    public int RoleId { get; set; }
    public string PermissionCode { get; set; } = string.Empty;
    public Role Role { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
}

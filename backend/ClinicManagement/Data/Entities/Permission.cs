namespace ClinicManagement.Data.Entities;

public class Permission
{
    public string Code { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string? Scope { get; set; }
    public bool IsImplemented { get; set; }
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

namespace ClinicManagement.Data.Entities;

public class Role
{
    public int RoleId { get; set; }

    public string RoleName { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    public bool IsSystem { get; set; } = false;
    public byte[] Version { get; set; } = [];
    public DateTime? UpdatedAt { get; set; }
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();

    public ICollection<User> Users { get; set; }
        = new List<User>();
}

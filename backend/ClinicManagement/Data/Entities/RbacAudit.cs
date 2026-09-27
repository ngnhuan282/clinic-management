namespace ClinicManagement.Data.Entities;

public class RbacAudit
{
    public long RbacAuditId { get; set; }
    public int ActorUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public DateTime CreatedAt { get; set; }
}

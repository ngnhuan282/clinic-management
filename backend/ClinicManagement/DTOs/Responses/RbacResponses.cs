namespace ClinicManagement.DTOs.Responses;

public record PermissionResponse(string Code, string Module, string Name, string Kind, string? Scope,
    bool IsImplemented, IReadOnlyList<string> AllowedSystemRoles);

public record RoleDetailResponse(int RoleId, string RoleName, string? Description, bool IsSystem,
    int UserCount, string Version, IReadOnlyList<string> PermissionCodes);

public record RbacAuditResponse(long RbacAuditId, int ActorUserId, string ActorUsername, string Action,
    string EntityType, int EntityId, string? BeforeJson, string? AfterJson, DateTime CreatedAt);

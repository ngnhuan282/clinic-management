using System.Data;
using System.Text.Json;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Hubs;
using ClinicManagement.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class RbacService(ApplicationDbContext db, ICurrentUserService currentUser,
    NotificationConnections connections)
{
    public async Task<List<PermissionResponse>> GetPermissionsAsync()
    {
        var rights = await db.Permissions.AsNoTracking().OrderBy(x => x.Module)
            .ThenBy(x => x.Code).ToListAsync();
        return rights.Select(x => new PermissionResponse(x.Code, x.Module, x.Name, x.Kind, x.Scope,
            x.IsImplemented, PermissionCatalog.DefaultRoles.Where(role => role.Value.Contains(x.Code))
                .Select(role => role.Key).ToArray())).ToList();
    }

    public async Task<PagedResponse<RoleDetailResponse>> GetRolesAsync(RoleQuery query)
    {
        var roles = db.Roles.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            roles = roles.Where(x => x.RoleName.Contains(search) ||
                (x.Description != null && x.Description.Contains(search)));
        }
        if (query.IsSystem.HasValue) roles = roles.Where(x => x.IsSystem == query.IsSystem.Value);
        var count = await roles.CountAsync();
        var rows = await roles.OrderBy(x => x.RoleId).Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize).Select(x => new
            {
                x.RoleId, x.RoleName, x.Description, x.IsSystem, x.Version,
                UserCount = x.Users.Count,
                Codes = x.RolePermissions.Select(right => right.PermissionCode).ToList()
            }).ToListAsync();
        return new PagedResponse<RoleDetailResponse>(rows.Select(x => new RoleDetailResponse(x.RoleId,
            x.RoleName, x.Description, x.IsSystem, x.UserCount, Convert.ToBase64String(x.Version),
            x.Codes.Order().ToArray())), query.PageNumber, query.PageSize, count);
    }

    public async Task<RoleDetailResponse> GetRoleAsync(int roleId)
    {
        var role = await db.Roles.AsNoTracking().Where(x => x.RoleId == roleId).Select(x => new
        {
            x.RoleId, x.RoleName, x.Description, x.IsSystem, x.Version,
            UserCount = x.Users.Count,
            Codes = x.RolePermissions.Select(right => right.PermissionCode).ToList()
        }).SingleOrDefaultAsync() ?? throw new AppException(ErrorCode.ROLE_NOT_FOUND);
        return new RoleDetailResponse(role.RoleId, role.RoleName, role.Description, role.IsSystem,
            role.UserCount, Convert.ToBase64String(role.Version), role.Codes.Order().ToArray());
    }

    public async Task<RoleDetailResponse> CreateRoleAsync(CreateRoleRequest request)
    {
        var name = NormalizeName(request.Name);
        var description = NormalizeDescription(request.Description);
        var codes = request.PermissionCodes;
        if (codes == null && request.CopyFromRoleId.HasValue)
        {
            var source = await db.Roles.AsNoTracking().Where(x => x.RoleId == request.CopyFromRoleId.Value)
                .Select(x => x.RolePermissions.Select(right => right.PermissionCode).ToList()).SingleOrDefaultAsync();
            codes = (source ?? throw new AppException(ErrorCode.ROLE_NOT_FOUND))
                .Where(code => !code.StartsWith("accounts.", StringComparison.Ordinal)).ToList();
        }
        codes ??= [];
        await ValidateCodesAsync(codes);
        if (codes.Any(code => code.StartsWith("accounts.", StringComparison.Ordinal)))
            throw new AppException(ErrorCode.ROLE_PERMISSION_NOT_ALLOWED);
        try
        {
            await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            if (await db.Roles.AnyAsync(x => x.RoleName == name)) throw new AppException(ErrorCode.ROLE_NAME_EXISTS);
            var role = new Role { RoleName = name, Description = description, IsSystem = false,
                UpdatedAt = DateTime.UtcNow };
            foreach (var code in codes.Distinct()) role.RolePermissions.Add(new RolePermission { PermissionCode = code });
            db.Roles.Add(role);
            await db.SaveChangesAsync();
            AddAudit("role.create", "Role", role.RoleId, null, new { role.RoleName, role.Description, Codes = codes });
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            return await GetRoleAsync(role.RoleId);
        }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new AppException(ErrorCode.ROLE_NAME_EXISTS); }
    }

    public async Task<RoleDetailResponse> UpdateRoleAsync(int roleId, UpdateRoleRequest request)
    {
        var name = NormalizeName(request.Name);
        var description = NormalizeDescription(request.Description);
        try
        {
            await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            var role = await db.Roles.SingleOrDefaultAsync(x => x.RoleId == roleId)
                ?? throw new AppException(ErrorCode.ROLE_NOT_FOUND);
            CheckVersion(role, request.Version);
            if (role.IsSystem) throw new AppException(ErrorCode.SYSTEM_ROLE_PROTECTED);
            if (await db.Roles.AnyAsync(x => x.RoleId != roleId && x.RoleName == name))
                throw new AppException(ErrorCode.ROLE_NAME_EXISTS);
            var before = new { role.RoleName, role.Description };
            if (role.RoleName == name && role.Description == description) return await GetRoleAsync(roleId);
            role.RoleName = name;
            role.Description = description;
            role.UpdatedAt = DateTime.UtcNow;
            AddAudit("role.update", "Role", roleId, before, new { role.RoleName, role.Description });
            await db.SaveChangesAsync();
            var affected = await InvalidateRoleSessionsAsync(roleId);
            await transaction.CommitAsync();
            foreach (var userId in affected) connections.DisconnectUser(userId);
            return await GetRoleAsync(roleId);
        }
        catch (DbUpdateConcurrencyException) { throw new AppException(ErrorCode.ROLE_CONFLICT); }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new AppException(ErrorCode.ROLE_NAME_EXISTS); }
    }

    public async Task<RoleDetailResponse> UpdatePermissionsAsync(int roleId,
        UpdateRolePermissionsRequest request)
    {
        await ValidateCodesAsync(request.PermissionCodes);
        try
        {
            await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            var role = await db.Roles.Include(x => x.RolePermissions).SingleOrDefaultAsync(x => x.RoleId == roleId)
                ?? throw new AppException(ErrorCode.ROLE_NOT_FOUND);
            CheckVersion(role, request.Version);
            var requested = request.PermissionCodes.ToHashSet(StringComparer.Ordinal);
            if (!role.IsSystem && requested.Any(code => code.StartsWith("accounts.", StringComparison.Ordinal)))
                throw new AppException(ErrorCode.ROLE_PERMISSION_NOT_ALLOWED);
            if (role.IsSystem && role.RoleName != RoleConstants.Admin
                && PermissionCatalog.DefaultRoles.TryGetValue(role.RoleName, out var allowed)
                && requested.Except(allowed).Any())
                throw new AppException(ErrorCode.ROLE_PERMISSION_NOT_ALLOWED);
            if (role.RoleName == RoleConstants.Admin && PermissionCatalog.AdminRequired.Any(x => !requested.Contains(x)))
                throw new AppException(ErrorCode.ADMIN_PERMISSION_REQUIRED);
            var before = role.RolePermissions.Select(x => x.PermissionCode).Order().ToArray();
            if (before.ToHashSet().SetEquals(requested)) return await GetRoleAsync(roleId);
            db.RolePermissions.RemoveRange(role.RolePermissions.Where(x => !requested.Contains(x.PermissionCode)));
            foreach (var code in requested.Where(x => !before.Contains(x)))
                role.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionCode = code });
            role.UpdatedAt = DateTime.UtcNow;
            AddAudit("role.permissions", "Role", roleId, before, requested.Order().ToArray());
            await db.SaveChangesAsync();
            var affected = await InvalidateRoleSessionsAsync(roleId);
            await transaction.CommitAsync();
            foreach (var userId in affected) connections.DisconnectUser(userId);
            return await GetRoleAsync(roleId);
        }
        catch (DbUpdateConcurrencyException) { throw new AppException(ErrorCode.ROLE_CONFLICT); }
    }

    public async Task DeleteRoleAsync(int roleId, DeleteRoleRequest request)
    {
        try
        {
            await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            var role = await db.Roles.Include(x => x.RolePermissions).SingleOrDefaultAsync(x => x.RoleId == roleId)
                ?? throw new AppException(ErrorCode.ROLE_NOT_FOUND);
            CheckVersion(role, request.Version);
            if (role.IsSystem) throw new AppException(ErrorCode.SYSTEM_ROLE_PROTECTED);
            if (await db.Users.AnyAsync(x => x.RoleId == roleId)) throw new AppException(ErrorCode.ROLE_IN_USE);
            AddAudit("role.delete", "Role", roleId,
                new { role.RoleName, role.Description, Codes = role.RolePermissions.Select(x => x.PermissionCode).ToArray() }, null);
            db.Roles.Remove(role);
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (DbUpdateConcurrencyException) { throw new AppException(ErrorCode.ROLE_CONFLICT); }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 547 })
        { throw new AppException(ErrorCode.ROLE_IN_USE); }
    }

    public async Task<PagedResponse<RbacAuditResponse>> GetAuditAsync(RbacAuditQuery query)
    {
        var audits = db.RbacAudits.AsNoTracking().AsQueryable();
        if (query.EntityId.HasValue) audits = audits.Where(x => x.EntityId == query.EntityId.Value);
        if (!string.IsNullOrWhiteSpace(query.EntityType))
            audits = audits.Where(x => x.EntityType == query.EntityType);
        var count = await audits.CountAsync();
        var rows = await audits.Join(db.Users.AsNoTracking(), audit => audit.ActorUserId,
                user => user.UserId, (audit, user) => new { audit, user.Username })
            .OrderByDescending(x => x.audit.RbacAuditId).Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize).Select(x => new RbacAuditResponse(x.audit.RbacAuditId,
                x.audit.ActorUserId, x.Username, x.audit.Action, x.audit.EntityType, x.audit.EntityId,
                x.audit.BeforeJson, x.audit.AfterJson, x.audit.CreatedAt)).ToListAsync();
        return new PagedResponse<RbacAuditResponse>(rows, query.PageNumber, query.PageSize, count);
    }

    private async Task ValidateCodesAsync(List<string> codes)
    {
        if (codes.Count != codes.Distinct(StringComparer.Ordinal).Count())
            throw new AppException(ErrorCode.INVALID_REQUEST);
        var known = await db.Permissions.AsNoTracking().Where(x => codes.Contains(x.Code))
            .Select(x => x.Code).ToListAsync();
        if (!known.ToHashSet(StringComparer.Ordinal).SetEquals(codes))
            throw new AppException(ErrorCode.PERMISSION_NOT_FOUND);
    }

    private async Task<List<int>> InvalidateRoleSessionsAsync(int roleId)
    {
        var userIds = await db.Users.AsNoTracking().Where(x => x.RoleId == roleId)
            .Select(x => x.UserId).ToListAsync();
        if (userIds.Count == 0) return userIds;
        await db.Users.Where(x => x.RoleId == roleId)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.SecurityVersion, x => x.SecurityVersion + 1));
        await db.RefreshTokens.Where(x => userIds.Contains(x.UserId) && x.RevokedAt == null)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.RevokedAt, DateTime.UtcNow));
        return userIds;
    }

    private void AddAudit(string action, string entityType, int entityId, object? before, object? after) =>
        db.RbacAudits.Add(new RbacAudit
        {
            ActorUserId = currentUser.GetRequiredUserId(), Action = action,
            EntityType = entityType, EntityId = entityId,
            BeforeJson = before == null ? null : JsonSerializer.Serialize(before),
            AfterJson = after == null ? null : JsonSerializer.Serialize(after),
            CreatedAt = DateTime.UtcNow
        });

    private static void CheckVersion(Role role, string version)
    {
        try
        {
            if (!role.Version.SequenceEqual(Convert.FromBase64String(version)))
                throw new AppException(ErrorCode.ROLE_CONFLICT);
        }
        catch (FormatException) { throw new AppException(ErrorCode.INVALID_REQUEST); }
    }

    private static string NormalizeName(string value)
    {
        var name = value.Trim();
        if (name.Length is < 2 or > 50 || name.Equals("Guest", StringComparison.OrdinalIgnoreCase))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        return name;
    }

    private static string NormalizeDescription(string value)
    {
        var description = value.Trim();
        if (description.Length is < 2 or > 200) throw new AppException(ErrorCode.INVALID_REQUEST);
        return description;
    }
}

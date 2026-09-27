using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Hubs;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using System.Text.Json;

namespace ClinicManagement.Services.Implementations;

public class UserService(IUserRepository users, IRoleRepository roles, ICurrentUserService currentUser,
    NotificationConnections connections, ApplicationDbContext db) : IUserService
{
    public async Task<PagedResponse<UserResponse>> GetPageAsync(UserQuery query)
    {
        var (items, total) = await users.GetPageAsync(query);
        return new(items.Select(x => x.ToResponse()), query.PageNumber, query.PageSize, total);
    }

    public async Task<UserResponse> GetByIdAsync(int userId) =>
        (await users.GetByIdAsync(userId) ?? throw new AppException(ErrorCode.USER_NOT_FOUND)).ToResponse();

    public async Task<List<RoleResponse>> GetRolesAsync() => (await roles.GetAllAsync())
        .Select(x => new RoleResponse(x.RoleId, x.RoleName, x.Description, x.IsSystem)).ToList();

    public async Task<UserResponse> UpdateAccessAsync(int userId, int? roleId, bool? status)
    {
        try
        {
            await using var transaction = await users.BeginAccessUpdateAsync();
            var user = await users.GetByIdAsync(userId) ?? throw new AppException(ErrorCode.USER_NOT_FOUND);
            var role = roleId.HasValue
                ? await roles.GetByIdAsync(roleId.Value) ?? throw new AppException(ErrorCode.ROLE_NOT_FOUND)
                : user.Role;
            var active = status ?? user.Status;
            if (role.RoleId == user.RoleId && active == user.Status) return user.ToResponse();
            if (userId == currentUser.GetRequiredUserId()) throw new AppException(ErrorCode.SELF_ACCESS_CHANGE);
            if (user.Status && user.Role.RoleName == RoleConstants.Admin
                && (!active || role.RoleName != RoleConstants.Admin)
                && await users.CountActiveAdminsAsync() <= 1)
                throw new AppException(ErrorCode.LAST_ADMIN);

            var before = new { user.RoleId, Role = user.Role.RoleName, user.Status };
            user.RoleId = role.RoleId;
            user.Role = role;
            user.Status = active;
            user.SecurityVersion++;
            await users.SaveChangesAsync();
            await users.RevokeRefreshTokensAsync(userId);
            db.RbacAudits.Add(new RbacAudit
            {
                ActorUserId = currentUser.GetRequiredUserId(), Action = roleId.HasValue ? "user.role" : "user.status",
                EntityType = "User", EntityId = userId,
                BeforeJson = JsonSerializer.Serialize(before),
                AfterJson = JsonSerializer.Serialize(new { user.RoleId, Role = role.RoleName, user.Status }),
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            connections.DisconnectUser(userId);
            return user.ToResponse();
        }
        catch (DbUpdateConcurrencyException) { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
        catch (SqlException error) when (error.Number == 1205) { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 1205 })
        { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
    }

}

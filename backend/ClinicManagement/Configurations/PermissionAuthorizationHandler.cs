using ClinicManagement.Commons;
using ClinicManagement.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Configurations;

public sealed record PermissionRequirement(string Code) : IAuthorizationRequirement;

public sealed class PermissionAuthorizationHandler(ApplicationDbContext db)
    : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (!int.TryParse(context.User.FindFirst(ClaimConstants.UserId)?.Value, out var userId)) return;
        var allowed = await db.Users.AsNoTracking().Where(x => x.UserId == userId && x.Status)
            .AnyAsync(x => x.Role.RolePermissions.Any(right => right.PermissionCode == requirement.Code));
        if (allowed) context.Succeed(requirement);
    }
}

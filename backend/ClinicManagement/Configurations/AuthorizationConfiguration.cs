using ClinicManagement.Commons;
using Microsoft.AspNetCore.Authorization;

namespace ClinicManagement.Configurations;

public static class AuthorizationConfiguration
{
    public static IServiceCollection AddApplicationAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            foreach (var permission in PermissionCatalog.All)
                options.AddPolicy(permission.Code, policy =>
                {
                    policy.RequireAuthenticatedUser().AddRequirements(new PermissionRequirement(permission.Code));
                    if (permission.Code.StartsWith("accounts.", StringComparison.Ordinal))
                        policy.RequireRole(RoleConstants.Admin);
                });
            options.AddPolicy(PolicyConstants.ManageUsers, policy =>
                policy.RequireAuthenticatedUser().RequireRole(RoleConstants.Admin)
                    .AddRequirements(new PermissionRequirement(PermissionCodes.AccountsManageRoles)));
            options.AddPolicy(PolicyConstants.InternalAccess, policy =>
                policy.RequireAuthenticatedUser().RequireRole(RoleConstants.Admin, RoleConstants.Doctor, RoleConstants.DepartmentHead, RoleConstants.Receptionist, RoleConstants.LabTechnician));
        });
        services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
        return services;
    }
}

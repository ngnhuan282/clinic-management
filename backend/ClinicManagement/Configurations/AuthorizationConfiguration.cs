using ClinicManagement.Commons;

namespace ClinicManagement.Configurations;

public static class AuthorizationConfiguration
{
    public static IServiceCollection AddApplicationAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy(PolicyConstants.ManageUsers, policy =>
                policy.RequireAuthenticatedUser().RequireRole(RoleConstants.Admin));
            options.AddPolicy(PolicyConstants.InternalAccess, policy =>
                policy.RequireAuthenticatedUser().RequireRole(RoleConstants.Admin, RoleConstants.Doctor, RoleConstants.Receptionist));
        });
        return services;
    }
}

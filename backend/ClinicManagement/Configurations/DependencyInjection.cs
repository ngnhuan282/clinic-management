using ClinicManagement.Repositories.Implementations;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Implementations;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Configurations;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services)
    {
        services.AddHttpContextAccessor();

        // =========================
        // Common / Security
        // =========================
        services.AddScoped<
            IPasswordHasherService,
            PasswordHasherService
        >();

        services.AddScoped<
            IJwtTokenGenerator,
            JwtTokenGenerator
        >();

        services.AddScoped<
            ICurrentUserService,
            CurrentUserService
        >();

        services.AddScoped<
            IRefreshTokenGenerator,
            RefreshTokenGenerator
        >();

        // =========================
        // Repositories
        // =========================
        services.AddScoped<
            IUserRepository,
            UserRepository
        >();

        services.AddScoped<
            IRoleRepository,
            RoleRepository
        >();

        // =========================
        // Business Services
        // =========================
        services.AddScoped<
            IAuthService,
            AuthService
        >();

        return services;
    }
}
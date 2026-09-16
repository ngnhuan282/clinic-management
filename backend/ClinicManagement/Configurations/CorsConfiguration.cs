namespace ClinicManagement.Configurations;

public static class CorsConfiguration
{
    public const string FrontendPolicy = "FrontendPolicy";

    public static IServiceCollection AddApplicationCors(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var frontendUrls =
            configuration["Cors:FrontendUrl"]
            ?? "http://localhost:5173";

        var origins = frontendUrls
            .Split(
                ',',
                StringSplitOptions.RemoveEmptyEntries
                | StringSplitOptions.TrimEntries
            );

        services.AddCors(options =>
        {
            options.AddPolicy(
                FrontendPolicy,
                policy =>
                {
                    policy
                        .WithOrigins(origins)
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                }
            );
        });

        return services;
    }
}

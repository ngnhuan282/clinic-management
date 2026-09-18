namespace ClinicManagement.Configurations;

public static class CorsConfiguration
{
    public const string FrontendPolicy = "FrontendPolicy";

    public static IServiceCollection AddApplicationCors(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var frontendUrl =
            configuration["Cors:FrontendUrl"]
            ?? "http://localhost:5173";

        services.AddCors(options =>
        {
            options.AddPolicy(
                FrontendPolicy,
                policy =>
                {
                    policy
                        .WithOrigins(frontendUrl)
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                }
            );
        });

        return services;
    }
}

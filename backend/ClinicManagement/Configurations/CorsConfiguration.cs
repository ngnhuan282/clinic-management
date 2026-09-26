namespace ClinicManagement.Configurations;

public static class CorsConfiguration
{
    public const string FrontendPolicy = "FrontendPolicy";

    public static IServiceCollection AddApplicationCors(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
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

        if (environment.IsDevelopment())
        {
            origins = origins
                .Concat(Enumerable.Range(5173, 3).SelectMany(port => new[]
                {
                    $"http://localhost:{port}",
                    $"http://127.0.0.1:{port}"
                }))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

        services.AddCors(options =>
        {
            options.AddPolicy(
                FrontendPolicy,
                policy =>
                {
                    policy
                        .WithOrigins(origins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                }
            );
        });

        return services;
    }
}

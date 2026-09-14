using Microsoft.OpenApi.Models;

namespace ClinicManagement.Configurations;

public static class SwaggerConfiguration
{
    public static IServiceCollection AddApplicationSwagger(
        this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(options =>
        {
            // =========================
            // Swagger Information
            // =========================
            options.SwaggerDoc(
                "v1",
                new OpenApiInfo
                {
                    Title = "Clinic Management API",
                    Version = "v1",
                    Description =
                        "RESTful API for Clinic Management System"
                }
            );

            // =========================
            // JWT Bearer Authentication
            // =========================
            options.AddSecurityDefinition(
                "Bearer",
                new OpenApiSecurityScheme
                {
                    Name = "Authorization",

                    Type = SecuritySchemeType.Http,

                    Scheme = "bearer",

                    BearerFormat = "JWT",

                    In = ParameterLocation.Header,

                    Description =
                        "Enter your JWT access token."
                }
            );

            // =========================
            // Apply JWT globally
            // =========================
            options.AddSecurityRequirement(
                new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type =
                                    ReferenceType.SecurityScheme,

                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                }
            );
        });

        return services;
    }
}
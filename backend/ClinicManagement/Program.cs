using ClinicManagement.Configurations;
using ClinicManagement.Data;
using ClinicManagement.Exceptions;
using Microsoft.EntityFrameworkCore;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Repositories.Implementations;
using ClinicManagement.Services;
using ClinicManagement.Services.Interfaces;
using ClinicManagement.Services.Implementations;
using ClinicManagement.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ClinicManagement
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // =========================
            // Controllers
            // =========================
            builder.Services.AddControllers();

            // =========================
            // Global Exception Handler
            // =========================
            builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
            builder.Services.AddProblemDetails();

            // =========================
            // JWT Settings
            // =========================
            builder.Services.Configure<JwtSettings>(
                builder.Configuration.GetSection(
                    JwtSettings.SectionName
                )
            );

            // =========================
            // JWT Authentication
            // =========================
            builder.Services.AddJwtAuthentication(
                builder.Configuration
            );

            // =========================
            // Authorization
            // =========================
            builder.Services.AddApplicationAuthorization();
            builder.Services.AddSignalR();
            builder.Services.AddSingleton<NotificationConnections>();
            builder.Services.AddSingleton<IUserIdProvider, NotificationUserIdProvider>();

            // =========================
            // Application Services
            // =========================
            builder.Services.AddApplicationServices();

            // =========================
            // Swagger
            // =========================
            builder.Services.AddApplicationSwagger();

            // =========================
            // CORS
            // =========================
            builder.Services.AddApplicationCors(
                builder.Configuration
            );

            // =========================
            // Database
            // =========================
            builder.Services.AddDbContext<ApplicationDbContext>(
                options =>
                    options.UseSqlServer(
                        builder.Configuration.GetConnectionString(
                            "DefaultConnection"
                        )
                    )
            );

            // =========================
            // Build Application
            // =========================

            //  Program Registration labtest 

            builder.Services.AddScoped<ILabTestTypeRepository, LabTestTypeRepository>();
            builder.Services.AddScoped<ILabTestTypeService, LabTestTypeService>();


                builder.Services.AddScoped<ILabTestService, LabTestService>();
            var app = builder.Build();

            // =========================
            // Global Exception Handler
            // =========================
            app.UseExceptionHandler();

            // =========================
            // Swagger
            // =========================
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            // =========================
            // CORS
            // =========================
            app.UseCors(
                CorsConfiguration.FrontendPolicy
            );

            // =========================
            // Authentication
            // =========================
            app.UseAuthentication();

            // =========================
            // Authorization
            // =========================
            app.UseAuthorization();

            app.MapControllers();
            app.MapHub<NotificationHub>("/hubs/notification", options => options.CloseOnAuthenticationExpiration = true);

            app.Run();
        }
    }
}

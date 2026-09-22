using System.Text;
using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore;
using ClinicManagement.Commons;
using ClinicManagement.Exceptions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace ClinicManagement.Configurations;

public static class JwtConfiguration
{
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSettings = configuration
            .GetSection(JwtSettings.SectionName)
            .Get<JwtSettings>();

        if (jwtSettings == null)
        {
            throw new InvalidOperationException(
                "JWT configuration is missing in appsettings.json."
            );
        }

        if (string.IsNullOrWhiteSpace(jwtSettings.Key) || Encoding.UTF8.GetByteCount(jwtSettings.Key) < 32)
        {
            throw new InvalidOperationException(
                "JWT secret key is missing."
            );
        }

        if (jwtSettings.AccessTokenExpirationMinutes <= 0 || jwtSettings.RefreshTokenExpirationDays <= 0)
            throw new InvalidOperationException("JWT expiration settings must be positive.");

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme =
                    JwtBearerDefaults.AuthenticationScheme;

                options.DefaultChallengeScheme =
                    JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.TokenValidationParameters =
                    new TokenValidationParameters
                    {
                        // Kiểm tra người phát hành token
                        ValidateIssuer = true,
                        ValidIssuer = jwtSettings.Issuer,

                        // Kiểm tra đối tượng sử dụng token
                        ValidateAudience = true,
                        ValidAudience = jwtSettings.Audience,

                        // Kiểm tra thời gian hết hạn
                        ValidateLifetime = true,

                        // Kiểm tra chữ ký token
                        ValidateIssuerSigningKey = true,

                        IssuerSigningKey =
                            new SymmetricSecurityKey(
                                Encoding.UTF8.GetBytes(
                                    jwtSettings.Key
                                )
                            ),

                        // Không cho token dùng thêm thời gian mặc định
                        ClockSkew = TimeSpan.Zero,

                        // Claim chứa Role
                        RoleClaimType = ClaimConstants.Role,

                        // Claim đại diện cho user
                        NameClaimType = ClaimConstants.UserId
                    };

                // ============================
                // Custom response 401 / 403
                // ============================
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        // Browser WebSockets/SSE cannot attach an Authorization header.
                        if (context.Request.Path.StartsWithSegments("/hubs/notification"))
                            context.Token = context.Request.Query["access_token"];
                        return Task.CompletedTask;
                    },
                    OnTokenValidated = async context =>
                    {
                        var principal = context.Principal;
                        if (!int.TryParse(principal?.FindFirst(ClaimConstants.UserId)?.Value, out var userId)
                            || !int.TryParse(principal?.FindFirst(ClaimConstants.SecurityVersion)?.Value, out var version))
                        {
                            context.Fail("Invalid account claims");
                            return;
                        }
                        var role = principal?.FindFirst(ClaimConstants.Role)?.Value;
                        var db = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                        if (!await db.Users.AsNoTracking().AnyAsync(x => x.UserId == userId && x.Status
                            && x.SecurityVersion == version && x.Role.RoleName == role, context.HttpContext.RequestAborted))
                            context.Fail("Account access has changed");
                    },
                    OnChallenge = async context =>
                    {
                        // Không cho ASP.NET tự trả response mặc định
                        context.HandleResponse();

                        var errorCode =
                            ErrorCode.UNAUTHENTICATED;

                        context.Response.StatusCode =
                            StatusCodes.Status401Unauthorized;

                        context.Response.ContentType =
                            "application/json";

                        var response =
                            ApiResponse<object>.Failure(
                                errorCode.Code,
                                errorCode.Message
                            );

                        await context.Response
                            .WriteAsJsonAsync(response);
                    },

                    OnForbidden = async context =>
                    {
                        var errorCode =
                            ErrorCode.UNAUTHORIZED;

                        context.Response.StatusCode =
                            StatusCodes.Status403Forbidden;

                        context.Response.ContentType =
                            "application/json";

                        var response =
                            ApiResponse<object>.Failure(
                                errorCode.Code,
                                errorCode.Message
                            );

                        await context.Response
                            .WriteAsJsonAsync(response);
                    }
                };
            });

        return services;
    }
}

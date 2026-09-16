using System.Text;
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

        if (string.IsNullOrWhiteSpace(jwtSettings.Key))
        {
            throw new InvalidOperationException(
                "JWT secret key is missing."
            );
        }

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
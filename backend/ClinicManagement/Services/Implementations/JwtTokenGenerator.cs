using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ClinicManagement.Commons;
using ClinicManagement.Configurations;
using ClinicManagement.Services.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ClinicManagement.Services.Implementations;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtSettings _jwtSettings;

    public JwtTokenGenerator(
        IOptions<JwtSettings> jwtOptions)
    {
        _jwtSettings = jwtOptions.Value;
    }

    public string GenerateAccessToken(
        int userId,
        string role)
    {
        var claims = new List<Claim>
        {
            new(
                ClaimConstants.UserId,
                userId.ToString()
            ),

            new(
                ClaimConstants.Role,
                role
            ),

            new(
                JwtRegisteredClaimNames.Sub,
                userId.ToString()
            ),

            new(
                JwtRegisteredClaimNames.Jti,
                Guid.NewGuid().ToString()
            )
        };

        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _jwtSettings.Key
            )
        );

        var credentials = new SigningCredentials(
            securityKey,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                _jwtSettings.AccessTokenExpirationMinutes
            ),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }
}
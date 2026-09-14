using System.Security.Cryptography;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class RefreshTokenGenerator
    : IRefreshTokenGenerator
{
    public string GenerateRefreshToken()
    {
        var randomBytes =
            RandomNumberGenerator.GetBytes(64);

        return Convert.ToBase64String(
            randomBytes
        );
    }
}
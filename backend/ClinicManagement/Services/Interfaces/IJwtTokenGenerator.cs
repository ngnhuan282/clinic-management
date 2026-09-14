namespace ClinicManagement.Services.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateAccessToken(
        int userId,
        string role
    );
}
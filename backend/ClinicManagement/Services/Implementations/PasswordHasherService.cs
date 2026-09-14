using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class PasswordHasherService
    : IPasswordHasherService
{
    private const int WorkFactor = 12;

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(
            password,
            workFactor: WorkFactor
        );
    }

    public bool VerifyPassword(
        string hashedPassword,
        string providedPassword)
    {
        if (string.IsNullOrWhiteSpace(hashedPassword)
            || string.IsNullOrWhiteSpace(providedPassword))
        {
            return false;
        }

        return BCrypt.Net.BCrypt.Verify(
            providedPassword,
            hashedPassword
        );
    }
}
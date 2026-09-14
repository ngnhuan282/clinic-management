using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace ClinicManagement.Services.Implementations;

public class PasswordHasherService : IPasswordHasherService
{
    private readonly PasswordHasher<object> _passwordHasher;

    public PasswordHasherService()
    {
        _passwordHasher = new PasswordHasher<object>();
    }

    public string HashPassword(string password)
    {
        return _passwordHasher.HashPassword(
            null!,
            password
        );
    }

    public bool VerifyPassword(
        string hashedPassword,
        string providedPassword)
    {
        var result = _passwordHasher.VerifyHashedPassword(
            null!,
            hashedPassword,
            providedPassword
        );

        return result == PasswordVerificationResult.Success
            || result == PasswordVerificationResult.SuccessRehashNeeded;
    }
}
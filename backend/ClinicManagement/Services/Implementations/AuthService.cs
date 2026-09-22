using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;
using ClinicManagement.Configurations;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace ClinicManagement.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IRefreshTokenGenerator _refreshTokenGenerator;
    private readonly JwtSettings _settings;

    public AuthService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IPasswordHasherService passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        IRefreshTokenRepository refreshTokens,
        IRefreshTokenGenerator refreshTokenGenerator,
        IOptions<JwtSettings> settings)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _refreshTokens = refreshTokens;
        _refreshTokenGenerator = refreshTokenGenerator;
        _settings = settings.Value;
    }

    public async Task<AuthResponse> RegisterAsync(
        RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username)
            || string.IsNullOrWhiteSpace(request.Password)
            || string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new AppException(
                ErrorCode.INVALID_REQUEST
            );
        }

        var existingUser =
            await _userRepository.GetByUsernameAsync(
                request.Username.Trim()
            );

        if (existingUser != null)
        {
            throw new AppException(
                ErrorCode.USER_EXISTED
            );
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var existingEmail =
                await _userRepository.GetByEmailAsync(
                    request.Email.Trim()
                );

            if (existingEmail != null)
            {
                throw new AppException(
                    ErrorCode.EMAIL_EXISTED
                );
            }
        }

        var patientRole =
            await _roleRepository.GetByNameAsync(
                RoleConstants.Patient
            );

        if (patientRole == null)
        {
            throw new AppException(
                ErrorCode.ROLE_NOT_FOUND
            );
        }

        var user = new User
        {
            Username = request.Username.Trim(),
            PasswordHash =
                _passwordHasher.HashPassword(
                    request.Password
                ),
            FullName = request.FullName.Trim(),
            Email = string.IsNullOrWhiteSpace(request.Email)
                ? null
                : request.Email.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone)
                ? null
                : request.Phone.Trim(),
            RoleId = patientRole.RoleId,
            Status = true,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        user.Role = patientRole;
        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> LoginAsync(
        LoginRequest request)
    {
        var user =
            await _userRepository.GetByUsernameAsync(
                request.Username.Trim()
            );

        if (user == null)
        {
            throw new AppException(
                ErrorCode.INVALID_CREDENTIALS
            );
        }

        var passwordValid =
            _passwordHasher.VerifyPassword(
                user.PasswordHash,
                request.Password
            );

        if (!passwordValid)
        {
            throw new AppException(
                ErrorCode.INVALID_CREDENTIALS
            );
        }

        if (!user.Status)
        {
            throw new AppException(
                ErrorCode.USER_INACTIVE
            );
        }

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshTokenRequest request)
    {
        var token = await _refreshTokens.GetByHashAsync(HashToken(request.RefreshToken));
        if (token == null || token.RevokedAt != null || token.ExpiresAt <= DateTime.UtcNow || !token.User.Status
            || token.SecurityVersion != token.User.SecurityVersion)
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        token.RevokedAt = DateTime.UtcNow;
        try
        {
            // Revocation and replacement are committed together; rowversion prevents double use.
            return await IssueTokensAsync(token.User);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    public async Task LogoutAsync(RefreshTokenRequest request)
    {
        var token = await _refreshTokens.GetByHashAsync(HashToken(request.RefreshToken));
        if (token == null || token.RevokedAt != null) return;
        token.RevokedAt = DateTime.UtcNow;
        try { await _refreshTokens.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException) { /* Already consumed by another request. */ }
    }

    private async Task<AuthResponse> IssueTokensAsync(User user)
    {
        var refreshToken = _refreshTokenGenerator.GenerateRefreshToken();
        await _refreshTokens.AddAsync(new RefreshToken
        {
            UserId = user.UserId,
            SecurityVersion = user.SecurityVersion,
            TokenHash = HashToken(refreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpirationDays)
        });
        await _refreshTokens.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = _jwtTokenGenerator.GenerateAccessToken(user.UserId, user.Role.RoleName, user.SecurityVersion),
            RefreshToken = refreshToken,
            UserId = user.UserId,
            Username = user.Username,
            FullName = user.FullName,
            Role = user.Role.RoleName
        };
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}

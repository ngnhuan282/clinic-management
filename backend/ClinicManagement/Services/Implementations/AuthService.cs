using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IPasswordHasherService passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
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
                request.Username
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
                    request.Email
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

        var token =
            _jwtTokenGenerator.GenerateAccessToken(
                user.UserId,
                patientRole.RoleName
            );

        return new AuthResponse
        {
            AccessToken = token,
            UserId = user.UserId,
            Username = user.Username,
            FullName = user.FullName,
            Role = patientRole.RoleName
        };
    }

    public async Task<AuthResponse> LoginAsync(
        LoginRequest request)
    {
        var user =
            await _userRepository.GetByUsernameAsync(
                request.Username
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

        var token =
            _jwtTokenGenerator.GenerateAccessToken(
                user.UserId,
                user.Role.RoleName
            );

        return new AuthResponse
        {
            AccessToken = token,
            UserId = user.UserId,
            Username = user.Username,
            FullName = user.FullName,
            Role = user.Role.RoleName
        };
    }
}
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RefreshAsync(RefreshTokenRequest request);
    Task LogoutAsync(RefreshTokenRequest request);
    Task<AuthResponse> RegisterAsync(
        RegisterRequest request
    );

    Task<AuthResponse> LoginAsync(
        LoginRequest request
    );
}

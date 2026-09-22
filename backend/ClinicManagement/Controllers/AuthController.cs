using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me([FromServices] IUserService users, [FromServices] ICurrentUserService currentUser) =>
        Ok(ApiResponse<UserResponse>.Success(await users.GetByIdAsync(currentUser.GetRequiredUserId())));

    private readonly IAuthService _authService;

    public AuthController(
        IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        RegisterRequest request)
    {
        var result =
            await _authService.RegisterAsync(request);

        return Ok(
            ApiResponse<AuthResponse>.Success(
                result,
                "Register successfully"
            )
        );
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshTokenRequest request) =>
        Ok(ApiResponse<AuthResponse>.Success(await _authService.RefreshAsync(request)));

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshTokenRequest request)
    {
        await _authService.LogoutAsync(request);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginRequest request)
    {
        var result =
            await _authService.LoginAsync(request);

        return Ok(
            ApiResponse<AuthResponse>.Success(
                result,
                "Login successfully"
            )
        );
    }
}

using ClinicManagement.Commons;
using ClinicManagement.Configurations;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/auth")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class AuthController : ControllerBase
{
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me([FromServices] IUserService users) =>
        Ok(ApiResponse<UserResponse>.Success(await users.GetMyProfileAsync()));

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe(UpdateMyProfileRequest request, [FromServices] IUserService users) =>
        Ok(ApiResponse<UserResponse>.Success(await users.UpdateMyProfileAsync(request)));

    private readonly IAuthService _authService;
    private readonly RefreshCookie _cookie;

    public AuthController(
        IAuthService authService, RefreshCookie cookie)
    {
        _authService = authService;
        _cookie = cookie;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        RegisterRequest request)
    {
        _cookie.ValidateOrigin(Request);
        var result =
            await _authService.RegisterAsync(request);
        _cookie.Write(Response, result);

        return Ok(
            ApiResponse<AuthResponse>.Success(
                result,
                "Register successfully"
            )
        );
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        _cookie.ValidateOrigin(Request);
        var result = await _authService.RefreshAsync(new() { RefreshToken = _cookie.Read(Request) });
        if (result == null)
            return Unauthorized(ApiResponse<object>.Failure(
                ErrorCode.UNAUTHENTICATED.Code, ErrorCode.UNAUTHENTICATED.Message));
        _cookie.Write(Response, result);
        return Ok(ApiResponse<AuthResponse>.Success(result));
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        _cookie.ValidateOrigin(Request);
        await _authService.LogoutAsync(new() { RefreshToken = _cookie.Read(Request) });
        _cookie.Delete(Response);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginRequest request)
    {
        _cookie.ValidateOrigin(Request);
        var result =
            await _authService.LoginAsync(request);
        _cookie.Write(Response, result);

        return Ok(
            ApiResponse<AuthResponse>.Success(
                result,
                "Login successfully"
            )
        );
    }
}

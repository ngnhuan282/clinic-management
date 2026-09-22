using ClinicManagement.Commons;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/test")]
public class TestController(ICurrentUserService currentUser) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("ping")]
    public IActionResult Ping() => Ok(ApiResponse<string>.Success("Backend is running"));

    [Authorize]
    [HttpGet("authenticated")]
    public IActionResult Authenticated() => Ok(ApiResponse<object>.Success(new
    {
        userId = currentUser.UserId,
        role = currentUser.Role,
        message = "Authentication works"
    }));

    [Authorize(Policy = PolicyConstants.InternalAccess)]
    [HttpGet("internal")]
    public IActionResult Internal() => Ok(ApiResponse<string>.Success("Internal access granted"));

    [Authorize(Roles = RoleConstants.Doctor)]
    [HttpGet("doctor")]
    public IActionResult DoctorOnly() => Ok(ApiResponse<string>.Success("Hello Doctor"));
}

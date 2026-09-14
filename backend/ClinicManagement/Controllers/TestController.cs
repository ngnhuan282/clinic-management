using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Exceptions;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ICurrentUserService _currentUserService;
    private readonly ApplicationDbContext _context;

    public TestController(
        IJwtTokenGenerator jwtTokenGenerator,
        ICurrentUserService currentUserService,
        ApplicationDbContext context)
    {
        _jwtTokenGenerator = jwtTokenGenerator;
        _currentUserService = currentUserService;
        _context = context;
    }

    // =========================
    // Test Backend
    // =========================
    [HttpGet("ping")]
    public IActionResult Ping()
    {
        return Ok(
            ApiResponse<string>.Success(
                "Backend is running"
            )
        );
    }

    // =========================
    // Test GlobalExceptionHandler
    // =========================
    [HttpGet("exception")]
    public IActionResult TestException()
    {
        throw new AppException(
            ErrorCode.USER_NOT_FOUND
        );
    }

    // =========================
    // Tạo JWT tạm để test
    // =========================
    [HttpGet("token")]
    public IActionResult GenerateToken()
    {
        var token =
            _jwtTokenGenerator.GenerateAccessToken(
                1,
                RoleConstants.Doctor
            );

        return Ok(
            ApiResponse<string>.Success(token)
        );
    }

    // =========================
    // Test Authentication
    // =========================
    [Authorize]
    [HttpGet("authenticated")]
    public IActionResult Authenticated()
    {
        return Ok(
            ApiResponse<object>.Success(
                new
                {
                    userId = _currentUserService.UserId,
                    role = _currentUserService.Role,
                    message = "Authentication works"
                }
            )
        );
    }

    [HttpGet("refresh-token")]
    public IActionResult TestRefreshToken()
    {
        var refreshToken =
            _refreshTokenGenerator
                .GenerateRefreshToken();

        return Ok(
            ApiResponse<string>.Success(
                refreshToken
            )
        );
    }

    // =========================
    // Test Role
    // =========================
    [Authorize(Roles = RoleConstants.Doctor)]
    [HttpGet("doctor")]
    public IActionResult DoctorOnly()
    {
        return Ok(
            ApiResponse<string>.Success(
                "Hello Doctor"
            )
        );
    }

    // =========================
    // Test Database
    // =========================
    [HttpPost("database")]
    public async Task<IActionResult> TestDatabase()
    {
        var role = new Role
        {
            RoleName =
                $"TestRole_{Guid.NewGuid():N}"[..20],

            Description =
                "Database connection test"
        };

        _context.Roles.Add(role);

        await _context.SaveChangesAsync();

        var savedRole =
            await _context.Roles
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.RoleId == role.RoleId
                );

        return Ok(
            ApiResponse<object>.Success(
                new
                {
                    savedRole?.RoleId,
                    savedRole?.RoleName,
                    savedRole?.Description
                },
                "Database write/read successfully"
            )
        );
    }
}
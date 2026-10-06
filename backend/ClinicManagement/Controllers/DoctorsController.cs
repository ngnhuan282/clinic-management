using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/doctors")]
public class DoctorsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly IDoctorService _doctorService;
    private readonly ApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DoctorsController(
        IBookingService bookingService, IDoctorService doctorService,
        ApplicationDbContext db, ICurrentUserService currentUser)
    {
        _bookingService = bookingService;
        _doctorService = doctorService;
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchPublicDoctors([FromQuery] PublicDoctorQuery query)
    {
        var result = await _doctorService.SearchPublicDoctorsAsync(query);
        return Ok(ApiResponse<PagedResponse<PublicDoctorResponse>>.Success(result));
    }

    [HttpGet("me")]
    [Authorize(Roles = RoleConstants.Doctor)]
    public async Task<IActionResult> GetMyProfile()
    {
        var result = await _doctorService.GetMyProfileAsync();
        return Ok(ApiResponse<DoctorProfileResponse>.Success(result));
    }

    [HttpPut("me")]
    [Authorize(Roles = RoleConstants.Doctor)]
    public async Task<IActionResult> UpdateMyProfile(UpdateDoctorProfileRequest request)
    {
        var result = await _doctorService.UpdateMyProfileAsync(request);
        return Ok(ApiResponse<DoctorProfileResponse>.Success(result));
    }

    [HttpGet]
    public async Task<IActionResult> GetDoctors(
        [FromQuery] int departmentId)
    {
        var result =
            await _bookingService.GetDoctorsByDepartmentAsync(
                departmentId
            );

        return Ok(
            ApiResponse<List<DoctorResponse>>.Success(
                result
            )
        );
    }

    [HttpPatch("{doctorId:int}/account")]
    [Authorize(Policy = PermissionCodes.AccountsAssignRole)]
    public async Task<IActionResult> LinkAccount(int doctorId, LinkDoctorAccountRequest request)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync();
        var doctor = await _db.Doctors.SingleOrDefaultAsync(x => x.DoctorId == doctorId)
            ?? throw new AppException(ErrorCode.DOCTOR_NOT_FOUND);
        var user = await _db.Users.SingleOrDefaultAsync(x => x.UserId == request.UserId)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);
        if (!user.Status || !await _db.RolePermissions.AnyAsync(x => x.RoleId == user.RoleId
            && x.PermissionCode == PermissionCodes.ClinicalViewAssigned))
            throw new AppException(ErrorCode.UNAUTHORIZED);
        if (await _db.Doctors.AnyAsync(x => x.UserId == request.UserId && x.DoctorId != doctorId))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        var oldUserId = doctor.UserId;
        doctor.UserId = request.UserId;
        _db.RbacAudits.Add(new RbacAudit
        {
            ActorUserId = _currentUser.GetRequiredUserId(), Action = "doctor.account",
            EntityType = "Doctor", EntityId = doctorId,
            BeforeJson = JsonSerializer.Serialize(new { UserId = oldUserId }),
            AfterJson = JsonSerializer.Serialize(new { doctor.UserId }), CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(ApiResponse<object>.Success(new { doctor.DoctorId, doctor.UserId }));
    }
}

public class LinkDoctorAccountRequest
{
    [Required, Range(1, int.MaxValue)] public int? UserId { get; set; }
}

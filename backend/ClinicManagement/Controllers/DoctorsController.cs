using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Exceptions;
using ClinicManagement.Hubs;
using System.Data;
using Microsoft.Data.SqlClient;
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
    private readonly NotificationConnections _connections;

    public DoctorsController(
        IBookingService bookingService, IDoctorService doctorService,
        ApplicationDbContext db, ICurrentUserService currentUser, NotificationConnections connections)
    {
        _bookingService = bookingService;
        _doctorService = doctorService;
        _db = db;
        _currentUser = currentUser;
        _connections = connections;
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
        try { return await LinkAccountCoreAsync(doctorId, request); }
        catch (DbUpdateConcurrencyException) { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
        catch (Exception error) when (IsLinkConflict(error))
        { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
    }

    private static bool IsLinkConflict(Exception error)
    {
        for (Exception? current = error; current != null; current = current.InnerException)
            if (current is SqlException { Number: 1205 or 2601 or 2627 }) return true;
        return false;
    }

    private async Task<IActionResult> LinkAccountCoreAsync(int doctorId, LinkDoctorAccountRequest request)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var doctor = await _db.Doctors.SingleOrDefaultAsync(x => x.DoctorId == doctorId)
            ?? throw new AppException(ErrorCode.DOCTOR_NOT_FOUND);
        var user = await _db.Users.SingleOrDefaultAsync(x => x.UserId == request.UserId)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);
        if (!user.Status || !await _db.RolePermissions.AnyAsync(x => x.RoleId == user.RoleId
            && x.PermissionCode == PermissionCodes.ClinicalViewAssigned && x.Permission.IsImplemented))
            throw new AppException(ErrorCode.UNAUTHORIZED);
        if (await _db.Doctors.AnyAsync(x => x.UserId == request.UserId && x.DoctorId != doctorId))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        var oldUserId = doctor.UserId;
        if (oldUserId == request.UserId)
            return Ok(ApiResponse<object>.Success(new { doctor.DoctorId, doctor.UserId }));
        doctor.UserId = request.UserId;
        var affectedIds = new[] { oldUserId, request.UserId }.Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToArray();
        foreach (var affected in await _db.Users.Where(x => affectedIds.Contains(x.UserId)).ToListAsync())
            affected.SecurityVersion++;
        await _db.RefreshTokens.Where(x => affectedIds.Contains(x.UserId) && x.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.RevokedAt, DateTime.UtcNow));
        _db.RbacAudits.Add(new RbacAudit
        {
            ActorUserId = _currentUser.GetRequiredUserId(), Action = "doctor.account",
            EntityType = "Doctor", EntityId = doctorId,
            BeforeJson = JsonSerializer.Serialize(new { UserId = oldUserId }),
            AfterJson = JsonSerializer.Serialize(new { doctor.UserId }), CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();
        foreach (var userId in affectedIds) _connections.DisconnectUser(userId);
        return Ok(ApiResponse<object>.Success(new { doctor.DoctorId, doctor.UserId }));
    }
}

public class LinkDoctorAccountRequest
{
    [Required, Range(1, int.MaxValue)] public int? UserId { get; set; }
}

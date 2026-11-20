using ClinicManagement.DTOs.Requests.Staff;
using ClinicManagement.DTOs.Responses.Shared;
using ClinicManagement.DTOs.Responses.Staff;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Exceptions;
using ClinicManagement.Hubs;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Text.Json;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/staff")]
public class StaffController(
    IStaffService service, ApplicationDbContext db,
    ICurrentUserService currentUser, NotificationConnections connections) : ControllerBase
{
    private static readonly string[] StaffRoles =
        [RoleConstants.Receptionist, RoleConstants.Cashier, RoleConstants.Pharmacist, RoleConstants.LabTechnician];

    [HttpGet] [Authorize(Policy = PermissionCodes.StaffManage)]
    public async Task<IActionResult> Get([FromQuery] StaffQuery query) => Ok(ApiResponse<PagedResponse<StaffResponse>>.Success(await service.GetAsync(query)));

    [HttpGet("{id:int}")] [Authorize(Policy = PermissionCodes.StaffManage)]
    public async Task<IActionResult> GetById(int id) => Ok(ApiResponse<StaffResponse>.Success(await service.GetByIdAsync(id)));

    [HttpPost] [Authorize(Policy = PermissionCodes.StaffManage)]
    public async Task<IActionResult> Create(CreateStaffRequest request) => Ok(ApiResponse<StaffResponse>.Success(await service.CreateAsync(request), "Staff profile created"));

    [HttpPut("{id:int}")] [Authorize(Policy = PermissionCodes.StaffManage)]
    public async Task<IActionResult> Update(int id, UpdateStaffRequest request) => Ok(ApiResponse<StaffResponse>.Success(await service.UpdateAsync(id, request), "Staff profile updated"));

    [HttpPatch("{id:int}/status")] [Authorize(Policy = PermissionCodes.StaffManage)]
    public async Task<IActionResult> Status(int id, [FromBody] bool isActive) { await service.UpdateStatusAsync(id, isActive); return Ok(ApiResponse<object>.Success(null, "Staff status updated")); }

    [HttpGet("linkable-users")]
    [Authorize(Policy = PermissionCodes.AccountsAssignRole)]
    public async Task<IActionResult> GetLinkableUsers()
    {
        var linked = db.StaffProfiles.Where(x => x.UserId != null).Select(x => x.UserId!.Value);
        var users = await db.Users
            .Where(x => x.Status && StaffRoles.Contains(x.Role.RoleName) && !linked.Contains(x.UserId))
            .OrderBy(x => x.FullName)
            .Select(x => new { x.UserId, x.Username, x.FullName, Role = x.Role.RoleName })
            .ToListAsync();
        return Ok(ApiResponse<object>.Success(users));
    }

    [HttpPatch("{staffId:int}/account")]
    [Authorize(Policy = PermissionCodes.AccountsAssignRole)]
    public async Task<IActionResult> LinkAccount(int staffId, LinkStaffAccountRequest request)
    {
        try { return await LinkAccountCoreAsync(staffId, request); }
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

    private async Task<IActionResult> LinkAccountCoreAsync(int staffId, LinkStaffAccountRequest request)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var staff = await db.StaffProfiles.SingleOrDefaultAsync(x => x.StaffId == staffId)
            ?? throw new AppException(ErrorCode.STAFF_NOT_FOUND);
        var user = await db.Users.Include(x => x.Role).SingleOrDefaultAsync(x => x.UserId == request.UserId)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);
        if (!user.Status || !StaffRoles.Contains(user.Role.RoleName))
            throw new AppException(ErrorCode.UNAUTHORIZED);
        if (await db.StaffProfiles.AnyAsync(x => x.UserId == request.UserId && x.StaffId != staffId))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        var oldUserId = staff.UserId;
        if (oldUserId == request.UserId)
            return Ok(ApiResponse<object>.Success(new { staff.StaffId, staff.UserId }));
        staff.UserId = request.UserId;
        staff.UpdatedAt = DateTime.UtcNow;
        var affectedIds = new[] { oldUserId, request.UserId }.Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToArray();
        foreach (var affected in await db.Users.Where(x => affectedIds.Contains(x.UserId)).ToListAsync())
            affected.SecurityVersion++;
        await db.RefreshTokens.Where(x => affectedIds.Contains(x.UserId) && x.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.RevokedAt, DateTime.UtcNow));
        db.RbacAudits.Add(new RbacAudit
        {
            ActorUserId = currentUser.GetRequiredUserId(), Action = "staff.account",
            EntityType = "Staff", EntityId = staffId,
            BeforeJson = JsonSerializer.Serialize(new { UserId = oldUserId }),
            AfterJson = JsonSerializer.Serialize(new { staff.UserId }), CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        foreach (var userId in affectedIds) connections.DisconnectUser(userId);
        return Ok(ApiResponse<object>.Success(new { staff.StaffId, staff.UserId }));
    }
}

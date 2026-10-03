using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Implementations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/rbac")]
[Authorize(Policy = PermissionCodes.AccountsManageRoles)]
public class RbacController(RbacService rbac) : ControllerBase
{
    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions() =>
        Ok(ApiResponse<List<PermissionResponse>>.Success(await rbac.GetPermissionsAsync()));

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles([FromQuery] RoleQuery query) =>
        Ok(ApiResponse<PagedResponse<RoleDetailResponse>>.Success(await rbac.GetRolesAsync(query)));

    [HttpGet("roles/{id:int}")]
    public async Task<IActionResult> GetRole(int id) =>
        Ok(ApiResponse<RoleDetailResponse>.Success(await rbac.GetRoleAsync(id)));

    [HttpPost("roles")]
    public async Task<IActionResult> CreateRole(CreateRoleRequest request)
    {
        var role = await rbac.CreateRoleAsync(request);
        return CreatedAtAction(nameof(GetRole), new { id = role.RoleId }, ApiResponse<RoleDetailResponse>.Success(role));
    }

    [HttpPut("roles/{id:int}")]
    public async Task<IActionResult> UpdateRole(int id, UpdateRoleRequest request) =>
        Ok(ApiResponse<RoleDetailResponse>.Success(await rbac.UpdateRoleAsync(id, request)));

    [HttpPut("roles/{id:int}/permissions")]
    public async Task<IActionResult> UpdatePermissions(int id, UpdateRolePermissionsRequest request) =>
        Ok(ApiResponse<RoleDetailResponse>.Success(await rbac.UpdatePermissionsAsync(id, request)));

    [HttpDelete("roles/{id:int}")]
    public async Task<IActionResult> DeleteRole(int id, [FromBody] DeleteRoleRequest request)
    {
        await rbac.DeleteRoleAsync(id, request);
        return NoContent();
    }

    [HttpGet("audit")]
    public async Task<IActionResult> GetAudit([FromQuery] RbacAuditQuery query) =>
        Ok(ApiResponse<PagedResponse<RbacAuditResponse>>.Success(await rbac.GetAuditAsync(query)));
}

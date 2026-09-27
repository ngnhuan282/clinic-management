using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(IUserService users) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = PermissionCodes.AccountsView)]
    public async Task<IActionResult> GetPage([FromQuery] UserQuery query) =>
        Ok(ApiResponse<PagedResponse<UserResponse>>.Success(await users.GetPageAsync(query)));

    [HttpGet("{id:int}")]
    [Authorize(Policy = PermissionCodes.AccountsView)]
    public async Task<IActionResult> GetById(int id) =>
        Ok(ApiResponse<UserResponse>.Success(await users.GetByIdAsync(id)));

    [HttpPatch("{id:int}/role")]
    [Authorize(Policy = PermissionCodes.AccountsAssignRole)]
    public async Task<IActionResult> UpdateRole(int id, UpdateUserRoleRequest request) =>
        Ok(ApiResponse<UserResponse>.Success(await users.UpdateAccessAsync(id, request.RoleId, null)));

    [HttpPatch("{id:int}/status")]
    [Authorize(Policy = PermissionCodes.AccountsUpdate)]
    public async Task<IActionResult> UpdateStatus(int id, UpdateUserStatusRequest request) =>
        Ok(ApiResponse<UserResponse>.Success(await users.UpdateAccessAsync(id, null, request.Status)));
}

using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Policy = PolicyConstants.ManageUsers)]
public class UsersController(IUserService users) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPage([FromQuery] UserQuery query) =>
        Ok(ApiResponse<PagedResponse<UserResponse>>.Success(await users.GetPageAsync(query)));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) =>
        Ok(ApiResponse<UserResponse>.Success(await users.GetByIdAsync(id)));

    [HttpPatch("{id:int}/role")]
    public async Task<IActionResult> UpdateRole(int id, UpdateUserRoleRequest request) =>
        Ok(ApiResponse<UserResponse>.Success(await users.UpdateAccessAsync(id, request.RoleId, null)));

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateUserStatusRequest request) =>
        Ok(ApiResponse<UserResponse>.Success(await users.UpdateAccessAsync(id, null, request.Status)));
}

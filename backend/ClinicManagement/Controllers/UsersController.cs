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

    [HttpGet("summary")]
    [Authorize(Policy = PermissionCodes.AccountsView)]
    public async Task<IActionResult> Summary([FromQuery] UserQuery query) =>
        Ok(ApiResponse<UserSummaryResponse>.Success(await users.GetSummaryAsync(query)));

    [HttpGet("available-doctor-profiles")]
    [Authorize(Policy = PermissionCodes.AccountsView)]
    public async Task<IActionResult> AvailableDoctors([FromQuery] AvailableDoctorQuery query) =>
        Ok(ApiResponse<PagedResponse<AccountDoctorResponse>>.Success(await users.GetAvailableDoctorsAsync(query)));

    [HttpPost]
    [Authorize(Policy = PermissionCodes.AccountsCreate)]
    [Authorize(Policy = PermissionCodes.AccountsAssignRole)]
    public async Task<IActionResult> Create(CreateStaffUserRequest request)
    {
        var result = await users.CreateStaffAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.UserId }, ApiResponse<UserResponse>.Success(result));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = PermissionCodes.AccountsUpdate)]
    public async Task<IActionResult> UpdateProfile(int id, UpdateUserProfileRequest request) =>
        Ok(ApiResponse<UserResponse>.Success(await users.UpdateProfileAsync(id, request)));

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

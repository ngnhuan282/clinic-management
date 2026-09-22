using ClinicManagement.Commons;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize(Policy = PolicyConstants.ManageUsers)]
public class RolesController(IUserService users) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(ApiResponse<List<RoleResponse>>.Success(await users.GetRolesAsync()));
}

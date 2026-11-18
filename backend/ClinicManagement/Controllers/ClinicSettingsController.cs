using ClinicManagement.Commons;
using ClinicManagement.Services.Implementations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/clinic-settings")]
public class ClinicSettingsController(ClinicSettingsService service) : ControllerBase
{
    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublic(CancellationToken cancellationToken) =>
        Ok(ApiResponse<PublicClinicSettingsResponse>.Success(await service.GetPublicAsync(cancellationToken)));

    [HttpGet]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> GetAdmin(CancellationToken cancellationToken) =>
        Ok(ApiResponse<ClinicSettingsResponse>.Success(await service.GetAdminAsync(cancellationToken)));

    [HttpPut]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> Update(UpdateClinicSettingsRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ClinicSettingsResponse>.Success(
            await service.UpdateAsync(request, cancellationToken),
            "Đã cập nhật cấu hình phòng khám."));
}

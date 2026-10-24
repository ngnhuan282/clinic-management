using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/department-head/statistics")]
[Authorize(Policy = PermissionCodes.ReportsDepartmentStatistics)]
public sealed class DepartmentHeadStatisticsController(IDepartmentStatisticsService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<DepartmentStatisticsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ApiResponse<DepartmentStatisticsResponse>>> Get(
        [FromQuery] DepartmentStatisticsQuery query, CancellationToken cancellationToken) =>
        Ok(ApiResponse<DepartmentStatisticsResponse>.Success(await service.GetAsync(query, cancellationToken)));
}

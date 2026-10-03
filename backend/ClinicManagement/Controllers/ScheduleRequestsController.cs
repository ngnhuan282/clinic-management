using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/schedule-requests")]
[Authorize(Roles = RoleConstants.Admin + "," + RoleConstants.DepartmentHead)]
[Authorize(Policy = PermissionCodes.SchedulesReview)]
public class ScheduleRequestsController(IScheduleReviewService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] PaginationRequest pagination) =>
        Ok(ApiResponse<object>.Success(await service.ListAsync(status, pagination.PageNumber, pagination.PageSize)));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) =>
        Ok(ApiResponse<object>.Success(await service.GetAsync(id)));

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id) =>
        Ok(ApiResponse<object>.Success(await service.ApproveAsync(id), "Schedule request approved"));

    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, RejectScheduleRequest request) =>
        Ok(ApiResponse<object>.Success(await service.RejectAsync(id, request.RejectReason), "Schedule request rejected"));
}

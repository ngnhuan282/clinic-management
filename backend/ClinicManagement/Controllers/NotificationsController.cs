using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController(INotificationService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<NotificationHistoryResponse>>>> List([FromQuery] PaginationRequest request) =>
        Ok(ApiResponse<PagedResponse<NotificationHistoryResponse>>.Success(await service.ListAsync(request.PageNumber, request.PageSize)));

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> Read(int id)
    {
        await service.MarkReadAsync(id);
        return Ok(ApiResponse<object>.Success(null!));
    }
}

using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Data.Entities;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/doctor-schedules")]
public class DoctorSchedulesController(IDoctorScheduleService service, IScheduleReviewService reviewService) : ControllerBase
{
    private readonly IScheduleReviewService _reviewService = reviewService;
    [HttpPost("request")]
    [Authorize(Roles = RoleConstants.Doctor)]
    public async Task<IActionResult> SubmitRequest(CreateDoctorScheduleRequest request) =>
        Ok(ApiResponse<object>.Success(await service.CreateRequestAsync(request), "Schedule request submitted"));

    [HttpGet("my-requests")]
    [Authorize(Roles = RoleConstants.Doctor)]
    public async Task<IActionResult> MyRequests() =>
        Ok(ApiResponse<object>.Success(await service.GetMyRequestsAsync()));

    [HttpGet("rooms")]
    [Authorize(Roles = RoleConstants.Doctor + "," + RoleConstants.DepartmentHead)]
    public async Task<IActionResult> Rooms() =>
        Ok(ApiResponse<object>.Success(await service.GetAvailableRoomsAsync()));

    [HttpPost("{id:int}/approve")]
    [Authorize(Roles = RoleConstants.Admin + "," + RoleConstants.DepartmentHead)]
    [Authorize(Policy = PermissionCodes.SchedulesReview)]
    public async Task<IActionResult> ApproveRequest(int id) =>
        Ok(ApiResponse<object>.Success(await _reviewService.ApproveAsync(id), "Schedule request approved"));

    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = RoleConstants.Admin + "," + RoleConstants.DepartmentHead)]
    [Authorize(Policy = PermissionCodes.SchedulesReview)]
    public async Task<IActionResult> RejectRequest(int id, RejectScheduleRequest request) =>
        Ok(ApiResponse<object>.Success(await _reviewService.RejectAsync(id, request.RejectReason), "Schedule request rejected"));

    [HttpPost]
    [Authorize(Policy = PermissionCodes.SchedulesManage)]
    public async Task<IActionResult> Create(CreateDoctorScheduleRequest request) =>
        Ok(ApiResponse<object>.Success(await service.CreateScheduleAsync(request), "Doctor schedule created"));

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] DateOnly? date,
        [FromQuery] DateOnly? weekStart,
        [FromQuery] int? specializationId) =>
        Ok(ApiResponse<object>.Success(await service.GetSchedulesAsync(date, weekStart, specializationId)));

    [HttpGet("available-slots")]
    [AllowAnonymous]
    public async Task<IActionResult> AvailableSlots([FromQuery] int doctorId, [FromQuery] int? specializationId, [FromQuery] DateOnly date) =>
        Ok(ApiResponse<object>.Success(await service.GetAvailableSlotsAsync(doctorId, specializationId, date)));
}

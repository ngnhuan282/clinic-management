using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController(IReviewService service) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Public([FromQuery] ReviewQuery query) =>
        Ok(ApiResponse<PagedResponse<ReviewResponse>>.Success(await service.ListPublicAsync(query)));

    [HttpGet("admin")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> Admin([FromQuery] ReviewQuery query) =>
        Ok(ApiResponse<PagedResponse<AdminReviewResponse>>.Success(await service.ListAdminAsync(query)));

    [HttpGet("my-appointments")]
    [Authorize(Roles = RoleConstants.Patient)]
    public async Task<IActionResult> MyAppointments([FromQuery] PaginationRequest query) =>
        Ok(ApiResponse<PagedResponse<ReviewAppointmentResponse>>.Success(await service.MyAppointmentsAsync(query)));

    [HttpPost]
    [Authorize(Roles = RoleConstants.Patient)]
    public async Task<IActionResult> Create(CreateReviewRequest request) =>
        Ok(ApiResponse<AdminReviewResponse>.Success(await service.CreateAsync(request)));

    [HttpPatch("{id:int}/visibility")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> Visibility(int id, ReviewVisibilityRequest request) =>
        Ok(ApiResponse<AdminReviewResponse>.Success(await service.SetVisibilityAsync(id, request.IsVisible!.Value)));
}

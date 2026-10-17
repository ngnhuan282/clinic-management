using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/stock-reviews")]
[Authorize(Policy = PermissionCodes.PharmacyPrescribe)]
public class StockReviewsController(IPrescriptionService prescriptions) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] DoctorStockReviewFilterRequest request) =>
        Ok(ApiResponse<PagedResponse<DoctorStockReviewListItem>>.Success(await prescriptions.GetStockReviewsAsync(request)));

    [HttpGet("{reviewId:int}")]
    public async Task<IActionResult> Detail(int reviewId) =>
        Ok(ApiResponse<DoctorStockReviewResponse>.Success(await prescriptions.GetStockReviewAsync(reviewId)));

    [HttpPost("{reviewId:int}/responses")]
    [ProducesResponseType(typeof(ApiResponse<DoctorStockReviewResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Respond(int reviewId, RespondStockReviewRequest request) =>
        Ok(ApiResponse<DoctorStockReviewResponse>.Success(await prescriptions.RespondToStockReviewAsync(reviewId, request)));
}

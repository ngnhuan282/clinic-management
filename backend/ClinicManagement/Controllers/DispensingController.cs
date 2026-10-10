using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/dispensing")]
[Authorize(Policy = PermissionCodes.PharmacyDispense)]
public class DispensingController : ControllerBase
{
    private readonly IDispensingService _dispensingService;

    public DispensingController(IDispensingService dispensingService)
    {
        _dispensingService = dispensingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] DispensingFilterRequest request)
    {
        var result = await _dispensingService.GetPagedAsync(request);
        return Ok(ApiResponse<PagedResponse<DispensingListItemResponse>>
            .Success(result));
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _dispensingService.GetSummaryAsync();
        return Ok(ApiResponse<DispensingSummaryResponse>.Success(result));
    }

    [HttpGet("{prescriptionId:int}")]
    public async Task<IActionResult> GetById(int prescriptionId)
    {
        var result = await _dispensingService.GetByIdAsync(
            prescriptionId
        );
        return Ok(ApiResponse<DispensingResponse>.Success(result));
    }

    [HttpPost("{prescriptionId:int}/confirm")]
    public async Task<IActionResult> Confirm(int prescriptionId)
    {
        var result = await _dispensingService.ConfirmAsync(
            prescriptionId
        );
        return Ok(ApiResponse<DispensingResponse>.Success(
            result,
            "Prescription dispensed successfully"
        ));
    }
}

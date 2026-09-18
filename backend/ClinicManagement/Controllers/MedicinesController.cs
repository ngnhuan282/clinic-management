using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/medicines")]
[Authorize(Roles = RoleConstants.Admin)]
public class MedicinesController : ControllerBase
{
    private readonly IMedicineService _medicineService;

    public MedicinesController(IMedicineService medicineService)
    {
        _medicineService = medicineService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] MedicineFilterRequest request)
    {
        var result =
            await _medicineService.GetPagedAsync(request);

        return Ok(
            ApiResponse<PagedResponse<MedicineResponse>>
                .Success(result)
        );
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var result =
            await _medicineService.GetSummaryAsync();

        return Ok(
            ApiResponse<MedicineSummaryResponse>
                .Success(result)
        );
    }

    [HttpGet("options")]
    public async Task<IActionResult> GetOptions()
    {
        var result =
            await _medicineService.GetOptionsAsync();

        return Ok(
            ApiResponse<IReadOnlyList<MedicineOptionResponse>>
                .Success(result)
        );
    }

    [HttpGet("{medicineId:int}")]
    public async Task<IActionResult> GetById(
        int medicineId)
    {
        var result =
            await _medicineService.GetByIdAsync(
                medicineId
            );

        return Ok(
            ApiResponse<MedicineResponse>
                .Success(result)
        );
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateMedicineRequest request)
    {
        var result =
            await _medicineService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { medicineId = result.MedicineId },
            ApiResponse<MedicineResponse>.Success(
                result,
                "Medicine created successfully"
            )
        );
    }

    [HttpPut("{medicineId:int}")]
    public async Task<IActionResult> Update(
        int medicineId,
        UpdateMedicineRequest request)
    {
        var result =
            await _medicineService.UpdateAsync(
                medicineId,
                request
            );

        return Ok(
            ApiResponse<MedicineResponse>.Success(
                result,
                "Medicine updated successfully"
            )
        );
    }

    [HttpDelete("{medicineId:int}")]
    public async Task<IActionResult> Delete(
        int medicineId)
    {
        await _medicineService.DeleteAsync(medicineId);

        return Ok(
            ApiResponse<object>.Success(
                null,
                "Medicine deleted successfully"
            )
        );
    }
}

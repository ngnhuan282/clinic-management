using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/diseases")]
[Authorize(Roles = RoleConstants.Admin + "," + RoleConstants.Doctor)]
public class DiseasesController : ControllerBase
{
    private readonly IDiseaseService _diseaseService;

    public DiseasesController(IDiseaseService diseaseService)
    {
        _diseaseService = diseaseService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] DiseaseFilterRequest request)
    {
        var result =
            await _diseaseService.GetPagedAsync(request);

        return Ok(
            ApiResponse<PagedResponse<DiseaseResponse>>
                .Success(result)
        );
    }

    [HttpGet("options")]
    public async Task<IActionResult> GetOptions(
        [FromQuery] bool includeInactive = false)
    {
        var result =
            await _diseaseService.GetOptionsAsync(includeInactive);

        return Ok(
            ApiResponse<IReadOnlyList<DiseaseOptionResponse>>
                .Success(result)
        );
    }

    [HttpGet("{diseaseId:int}")]
    public async Task<IActionResult> GetById(int diseaseId)
    {
        var result =
            await _diseaseService.GetByIdAsync(diseaseId);

        return Ok(
            ApiResponse<DiseaseResponse>.Success(result)
        );
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateDiseaseRequest request)
    {
        var result =
            await _diseaseService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { diseaseId = result.DiseaseId },
            ApiResponse<DiseaseResponse>.Success(
                result,
                "Disease created successfully"
            )
        );
    }

    [HttpPut("{diseaseId:int}")]
    public async Task<IActionResult> Update(
        int diseaseId,
        UpdateDiseaseRequest request)
    {
        var result =
            await _diseaseService.UpdateAsync(
                diseaseId,
                request
            );

        return Ok(
            ApiResponse<DiseaseResponse>.Success(
                result,
                "Disease updated successfully"
            )
        );
    }

    [HttpDelete("{diseaseId:int}")]
    public async Task<IActionResult> Delete(int diseaseId)
    {
        await _diseaseService.DeleteAsync(diseaseId);

        return Ok(
            ApiResponse<object>.Success(
                null,
                "Disease deleted successfully"
            )
        );
    }
}

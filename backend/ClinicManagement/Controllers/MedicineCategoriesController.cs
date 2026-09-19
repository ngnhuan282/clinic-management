using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/medicine-categories")]
[Authorize(Roles = RoleConstants.Admin)]
public class MedicineCategoriesController : ControllerBase
{
    private readonly IMedicineCategoryService _categoryService;

    public MedicineCategoriesController(
        IMedicineCategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] MedicineCategoryFilterRequest request)
    {
        var result =
            await _categoryService.GetPagedAsync(request);

        return Ok(
            ApiResponse<PagedResponse<MedicineCategoryResponse>>
                .Success(result)
        );
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var result =
            await _categoryService.GetSummaryAsync();

        return Ok(
            ApiResponse<MedicineCategorySummaryResponse>
                .Success(result)
        );
    }

    [HttpGet("{categoryId:int}")]
    public async Task<IActionResult> GetById(int categoryId)
    {
        var result =
            await _categoryService.GetByIdAsync(categoryId);

        return Ok(
            ApiResponse<MedicineCategoryResponse>
                .Success(result)
        );
    }

    [HttpGet("options")]
    public async Task<IActionResult> GetOptions()
    {
        var result =
            await _categoryService.GetOptionsAsync();

        return Ok(
            ApiResponse<
                IReadOnlyList<MedicineCategoryOptionResponse>>
                .Success(result)
        );
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateMedicineCategoryRequest request)
    {
        var result =
            await _categoryService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { categoryId = result.CategoryId },
            ApiResponse<MedicineCategoryResponse>.Success(
                result,
                "Medicine category created successfully"
            )
        );
    }

    [HttpPut("{categoryId:int}")]
    public async Task<IActionResult> Update(
        int categoryId,
        UpdateMedicineCategoryRequest request)
    {
        var result =
            await _categoryService.UpdateAsync(
                categoryId,
                request
            );

        return Ok(
            ApiResponse<MedicineCategoryResponse>.Success(
                result,
                "Medicine category updated successfully"
            )
        );
    }

    [HttpDelete("{categoryId:int}")]
    public async Task<IActionResult> Delete(int categoryId)
    {
        await _categoryService.DeleteAsync(categoryId);

        return Ok(
            ApiResponse<object>.Success(
                null,
                "Medicine category deleted successfully"
            )
        );
    }
}

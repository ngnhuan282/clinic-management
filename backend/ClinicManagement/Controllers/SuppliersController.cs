using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/suppliers")]
[Authorize(Roles = RoleConstants.Admin)]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;

    public SuppliersController(ISupplierService supplierService)
    {
        _supplierService = supplierService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] SupplierFilterRequest request)
    {
        var result =
            await _supplierService.GetPagedAsync(request);

        return Ok(
            ApiResponse<PagedResponse<SupplierResponse>>
                .Success(result)
        );
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var result =
            await _supplierService.GetSummaryAsync();

        return Ok(
            ApiResponse<SupplierSummaryResponse>
                .Success(result)
        );
    }

    [HttpGet("{supplierId:int}")]
    public async Task<IActionResult> GetById(int supplierId)
    {
        var result =
            await _supplierService.GetByIdAsync(supplierId);

        return Ok(
            ApiResponse<SupplierResponse>.Success(result)
        );
    }

    [HttpGet("options")]
    public async Task<IActionResult> GetOptions()
    {
        var result =
            await _supplierService.GetOptionsAsync();

        return Ok(
            ApiResponse<IReadOnlyList<SupplierOptionResponse>>
                .Success(result)
        );
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateSupplierRequest request)
    {
        var result =
            await _supplierService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { supplierId = result.SupplierId },
            ApiResponse<SupplierResponse>.Success(
                result,
                "Supplier created successfully"
            )
        );
    }

    [HttpPut("{supplierId:int}")]
    public async Task<IActionResult> Update(
        int supplierId,
        UpdateSupplierRequest request)
    {
        var result =
            await _supplierService.UpdateAsync(
                supplierId,
                request
            );

        return Ok(
            ApiResponse<SupplierResponse>.Success(
                result,
                "Supplier updated successfully"
            )
        );
    }

    [HttpDelete("{supplierId:int}")]
    public async Task<IActionResult> Delete(int supplierId)
    {
        await _supplierService.DeleteAsync(supplierId);

        return Ok(
            ApiResponse<object>.Success(
                null,
                "Supplier deleted successfully"
            )
        );
    }
}

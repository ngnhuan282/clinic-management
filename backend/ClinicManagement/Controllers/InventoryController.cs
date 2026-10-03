using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/inventory")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet]
    [Authorize(Policy = PermissionCodes.PharmacyViewInventory)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] InventoryFilterRequest request)
    {
        var result =
            await _inventoryService.GetPagedAsync(request);

        return Ok(
            ApiResponse<PagedResponse<InventoryResponse>>
                .Success(result)
        );
    }

    [HttpGet("summary")]
    [Authorize(Policy = PermissionCodes.PharmacyViewInventory)]
    public async Task<IActionResult> GetSummary()
    {
        var result =
            await _inventoryService.GetSummaryAsync();

        return Ok(
            ApiResponse<InventorySummaryResponse>
                .Success(result)
        );
    }

    [HttpGet("{inventoryId:int}")]
    [Authorize(Policy = PermissionCodes.PharmacyViewInventory)]
    public async Task<IActionResult> GetById(
        int inventoryId)
    {
        var result =
            await _inventoryService.GetByIdAsync(
                inventoryId
            );

        return Ok(
            ApiResponse<InventoryResponse>
                .Success(result)
        );
    }

    [HttpPost]
    [Authorize(Policy = PermissionCodes.PharmacyManageInventory)]
    public async Task<IActionResult> Create(
        CreateInventoryRequest request)
    {
        var result =
            await _inventoryService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { inventoryId = result.InventoryId },
            ApiResponse<InventoryResponse>.Success(
                result,
                "Inventory batch created successfully"
            )
        );
    }

    [HttpPut("{inventoryId:int}")]
    [Authorize(Policy = PermissionCodes.PharmacyManageInventory)]
    public async Task<IActionResult> Update(
        int inventoryId,
        UpdateInventoryRequest request)
    {
        var result =
            await _inventoryService.UpdateAsync(
                inventoryId,
                request
            );

        return Ok(
            ApiResponse<InventoryResponse>.Success(
                result,
                "Inventory batch updated successfully"
            )
        );
    }

    [HttpDelete("{inventoryId:int}")]
    [Authorize(Policy = PermissionCodes.PharmacyManageInventory)]
    public async Task<IActionResult> Delete(
        int inventoryId)
    {
        await _inventoryService.DeleteAsync(inventoryId);

        return Ok(
            ApiResponse<object>.Success(
                null,
                "Inventory batch deleted successfully"
            )
        );
    }
}

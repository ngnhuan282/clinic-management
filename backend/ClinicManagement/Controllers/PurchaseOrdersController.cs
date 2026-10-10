using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/purchase-orders")]
[Authorize]
public class PurchaseOrdersController : ControllerBase
{
    private readonly IPurchaseOrderService _purchaseOrderService;

    public PurchaseOrdersController(
        IPurchaseOrderService purchaseOrderService)
    {
        _purchaseOrderService = purchaseOrderService;
    }

    [HttpGet]
    [Authorize(Policy = PermissionCodes.PharmacyViewInventory)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] PurchaseOrderFilterRequest request)
    {
        var result = await _purchaseOrderService.GetPagedAsync(request);
        return Ok(ApiResponse<PagedResponse<PurchaseOrderResponse>>
            .Success(result));
    }

    [HttpGet("summary")]
    [Authorize(Policy = PermissionCodes.PharmacyViewInventory)]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _purchaseOrderService.GetSummaryAsync();
        return Ok(ApiResponse<PurchaseOrderSummaryResponse>
            .Success(result));
    }

    [HttpGet("{purchaseOrderId:int}")]
    [Authorize(Policy = PermissionCodes.PharmacyViewInventory)]
    public async Task<IActionResult> GetById(int purchaseOrderId)
    {
        var result = await _purchaseOrderService.GetByIdAsync(
            purchaseOrderId
        );
        return Ok(ApiResponse<PurchaseOrderResponse>.Success(result));
    }

    [HttpPost]
    [Authorize(Policy = PermissionCodes.PharmacyManageInventory)]
    public async Task<IActionResult> Create(
        CreatePurchaseOrderRequest request)
    {
        var result = await _purchaseOrderService.CreateAsync(request);
        return CreatedAtAction(
            nameof(GetById),
            new { purchaseOrderId = result.PurchaseOrderId },
            ApiResponse<PurchaseOrderResponse>.Success(
                result,
                "Purchase order created successfully"
            )
        );
    }

    [HttpPut("{purchaseOrderId:int}")]
    [Authorize(Policy = PermissionCodes.PharmacyManageInventory)]
    public async Task<IActionResult> Update(
        int purchaseOrderId,
        UpdatePurchaseOrderRequest request)
    {
        var result = await _purchaseOrderService.UpdateAsync(
            purchaseOrderId,
            request
        );
        return Ok(ApiResponse<PurchaseOrderResponse>.Success(
            result,
            "Purchase order updated successfully"
        ));
    }

    [HttpPost("{purchaseOrderId:int}/receive")]
    [Authorize(Policy = PermissionCodes.PharmacyManageInventory)]
    public async Task<IActionResult> Receive(int purchaseOrderId)
    {
        var result = await _purchaseOrderService.ReceiveAsync(
            purchaseOrderId
        );
        return Ok(ApiResponse<PurchaseOrderResponse>.Success(
            result,
            "Purchase order received successfully"
        ));
    }

    [HttpPost("{purchaseOrderId:int}/cancel")]
    [Authorize(Policy = PermissionCodes.PharmacyManageInventory)]
    public async Task<IActionResult> Cancel(int purchaseOrderId)
    {
        var result = await _purchaseOrderService.CancelAsync(
            purchaseOrderId
        );
        return Ok(ApiResponse<PurchaseOrderResponse>.Success(
            result,
            "Purchase order cancelled successfully"
        ));
    }
}

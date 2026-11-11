using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClinicManagement.DTOs.Invoices;
using ClinicManagement.Commons;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = RoleConstants.Cashier + "," + RoleConstants.Admin)]
    public class InvoicesController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;
        private readonly ICurrentUserService _currentUser;

        public InvoicesController(IInvoiceService invoiceService, ICurrentUserService currentUser)
        {
            _invoiceService = invoiceService;
            _currentUser = currentUser;
        }

        // Lấy danh sách sổ chờ thu tiền theo BillingStage ("Pending" hoặc "LabAndConsultation")
        [HttpGet("pending")]
        [Authorize(Policy = PermissionCodes.BillingView)]
        public async Task<IActionResult> GetPendingBillings([FromQuery] string stage = "Pending")
        {
            var data = await _invoiceService.GetPendingBillingsAsync(stage);
            return Ok(data);
        }

        // Thu ngân lập Hóa đơn
        [HttpPost]
        [Authorize(Policy = PermissionCodes.BillingCreate)]
        [Authorize(Policy = PermissionCodes.BillingRecordPayment)]
public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto dto)
{
    // 1. Lấy claim UserId/NameIdentifier từ JWT Token an toàn
    var cashierId = _currentUser.GetRequiredUserId();

    // 3. Gọi Service tạo hóa đơn
    var result = await _invoiceService.CreateInvoiceAsync(cashierId, dto);
    return Ok(result);
}

        // Xem chi tiết hóa đơn đã lập
        [HttpGet("{id}")]
        [Authorize(Policy = PermissionCodes.BillingView)]
        public async Task<IActionResult> GetById(int id)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

// Tra cứu lịch sử hóa đơn đã lập
[HttpGet("history")]
[Authorize(Policy = PermissionCodes.BillingView)]
public async Task<IActionResult> GetInvoiceHistory([FromQuery] string? search)
{
    var data = await _invoiceService.GetInvoiceHistoryAsync(search);
    return Ok(data);
}

// Lập chứng từ điều chỉnh (Adjustment Invoice)
[HttpPost("adjustment")]
[Authorize(Policy = PermissionCodes.BillingCreate)]
[Authorize(Policy = PermissionCodes.BillingRecordPayment)]
public async Task<IActionResult> CreateAdjustmentInvoice([FromBody] CreateAdjustmentInvoiceDto dto)
{
    var cashierId = _currentUser.GetRequiredUserId();

    try
    {
        var result = await _invoiceService.CreateAdjustmentInvoiceAsync(cashierId, dto);
        return Ok(result);
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}

    }
}

using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClinicManagement.DTOs.Requests.Billing;
using ClinicManagement.Commons;
using ClinicManagement.Services.Interfaces;
using ClinicManagement.Exceptions;

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

        // Lấy danh sách sổ chờ thu tiền theo BillingStage ("Book", "Pending", "LabAndConsultation", "Medicine", "Final")
        [HttpGet("pending")]
        [Authorize(Policy = PermissionCodes.BillingView)]
        public async Task<IActionResult> GetPendingBillings([FromQuery] string stage = "Pending")
        {
            var data = await _invoiceService.GetPendingBillingsAsync(stage);
            return Ok(data);
        }

        // Thu ngân lập Hóa đơn (có thể thu 0đ, thu một phần, hoặc thu đủ)
        [HttpPost]
        [Authorize(Policy = PermissionCodes.BillingCreate)]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto dto)
        {
            if (dto.InitialPaymentAmount is null or > 0 &&
                !(await HttpContext.RequestServices.GetRequiredService<IAuthorizationService>()
                    .AuthorizeAsync(User, PermissionCodes.BillingRecordPayment)).Succeeded)
                throw new AppException(ErrorCode.UNAUTHORIZED);
            var cashierId = _currentUser.GetRequiredUserId();
            var result = await _invoiceService.CreateInvoiceAsync(cashierId, dto);
            return Ok(result);
        }

        // Ghi nhận thanh toán cho hóa đơn Unpaid / PartiallyPaid (VII.6)
        [HttpPost("{id:int}/payments")]
        [Authorize(Policy = PermissionCodes.BillingRecordPayment)]
        public async Task<IActionResult> RecordPayment(int id, [FromBody] RecordInvoicePaymentDto dto)
        {
            var cashierId = _currentUser.GetRequiredUserId();
            var result = await _invoiceService.RecordPaymentAsync(id, cashierId, dto);
            return Ok(result);
        }

        // Xem chi tiết hóa đơn đã lập
        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionCodes.BillingView)]
        public async Task<IActionResult> GetById(int id)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        // Tra cứu lịch sử hóa đơn & phiếu thu đã lập
        [HttpGet("history")]
        [Authorize(Policy = PermissionCodes.BillingView)]
        public async Task<IActionResult> GetInvoiceHistory([FromQuery] string? search)
        {
            var data = await _invoiceService.GetInvoiceHistoryAsync(search);
            return Ok(data);
        }

        // Lập chứng từ điều chỉnh / hoàn tiền (VII.8)
        [HttpPost("adjustment")]
        [Authorize(Policy = PermissionCodes.BillingCreate)]
        [Authorize(Policy = PermissionCodes.BillingRecordPayment)]
        public async Task<IActionResult> CreateAdjustmentInvoice([FromBody] CreateAdjustmentInvoiceDto dto)
        {
            var cashierId = _currentUser.GetRequiredUserId();
            var result = await _invoiceService.CreateAdjustmentInvoiceAsync(cashierId, dto);
            return Ok(result);
        }

        [HttpPost("adjustment/preview")]
        [Authorize(Policy = PermissionCodes.BillingCreate)]
        [Authorize(Policy = PermissionCodes.BillingRecordPayment)]
        public async Task<IActionResult> PreviewAdjustment([FromBody] CreateAdjustmentInvoiceDto dto)
            => Ok(await _invoiceService.PreviewAdjustmentAsync(dto));
    }
}

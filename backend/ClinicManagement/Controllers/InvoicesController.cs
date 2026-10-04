using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClinicManagement.DTOs.Invoices;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Cashier,Admin")]
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
        public async Task<IActionResult> GetPendingBillings([FromQuery] string stage = "Pending")
        {
            var data = await _invoiceService.GetPendingBillingsAsync(stage);
            return Ok(data);
        }

        // Thu ngân lập Hóa đơn
        [HttpPost]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto dto)
        {
            try
            {
                var cashierId = _currentUser.GetRequiredUserId();
                var invoice = await _invoiceService.CreateInvoiceAsync(cashierId, dto);
                return Ok(invoice);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Xem chi tiết hóa đơn đã lập
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }
    }
}

using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/patients")]
public class ReceptionPatientsController : ControllerBase
{
    private readonly IReceptionService _service;

    public ReceptionPatientsController(IReceptionService service) => _service = service;

    [HttpGet("matches")]
    [Authorize(Policy = PermissionCodes.AppointmentsCreateWalkIn)]
    public async Task<IActionResult> FindMatches([FromQuery] string search)
    {
        var result = await _service.FindPatientsAsync(search);
        return Ok(ApiResponse<List<PatientMatchResponse>>.Success(result));
    }

    [HttpGet("{patientId:int}/books")]
    [Authorize(Policy = PermissionCodes.AppointmentsCheckIn)]
    public async Task<IActionResult> GetBooks(int patientId)
    {
        var result = await _service.GetBooksAsync(patientId);
        return Ok(ApiResponse<List<PatientBookResponse>>.Success(result));
    }

    [HttpPost("{patientId:int}/books/existing")]
    [Authorize(Policy = PermissionCodes.AppointmentsCheckIn)]
    public async Task<IActionResult> RegisterExistingBook(int patientId, RegisterExistingBookRequest request)
    {
        var result = await _service.RegisterExistingBookAsync(patientId, request);
        return Ok(ApiResponse<PatientBookResponse>.Success(result));
    }

    [HttpGet("{patientId:int}/book-invoices")]
    [Authorize(Policy = PermissionCodes.BillingView)]
    public async Task<IActionResult> GetBookInvoices(int patientId)
    {
        var result = await _service.GetBookInvoicesAsync(patientId);
        return Ok(ApiResponse<List<BookInvoiceResponse>>.Success(result));
    }

    [HttpPost("{patientId:int}/book-invoices")]
    [Authorize(Policy = PermissionCodes.BillingCreate)]
    public async Task<IActionResult> CreateBookInvoice(int patientId, CreateBookInvoiceRequest request)
    {
        var result = await _service.CreateBookInvoiceAsync(patientId, request);
        return Ok(ApiResponse<BookInvoiceResponse>.Success(result));
    }
}

[ApiController]
[Route("api/book-invoices")]
public class BookInvoicesController : ControllerBase
{
    private readonly IReceptionService _service;

    public BookInvoicesController(IReceptionService service) => _service = service;

    [HttpPatch("{invoiceId:int}/pay")]
    [Authorize(Policy = PermissionCodes.BillingRecordPayment)]
    public async Task<IActionResult> MarkPaid(int invoiceId)
    {
        var result = await _service.MarkBookInvoicePaidAsync(invoiceId);
        return Ok(ApiResponse<BookInvoiceResponse>.Success(result));
    }

    [HttpPost("{invoiceId:int}/issue-book")]
    [Authorize(Policy = PermissionCodes.AppointmentsCheckIn)]
    public async Task<IActionResult> IssueBook(int invoiceId, IssueBookRequest request)
    {
        var result = await _service.IssueBookAsync(invoiceId, request.BookNumber);
        return Ok(ApiResponse<PatientBookResponse>.Success(result));
    }
}

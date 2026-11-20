using ClinicManagement.DTOs.Requests.Shared;
using ClinicManagement.DTOs.Responses.Billing;
using ClinicManagement.DTOs.Responses.Shared;
using ClinicManagement.Commons;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/patients/me/invoices")]
[Authorize(Roles = RoleConstants.Patient)]
public class PatientInvoicesController(IInvoiceService invoices, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] PaginationRequest query) =>
        Ok(ApiResponse<PagedResponse<PatientInvoiceResponse>>.Success(
            await invoices.GetPatientInvoicesAsync(currentUser.GetRequiredUserId(), query)));
}

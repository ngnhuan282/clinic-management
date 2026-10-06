using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/PatientBooks")]
[Authorize(Policy = PermissionCodes.AppointmentsCheckIn)]
public class PatientBooksController(IPatientBookService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] PatientBookQuery query) =>
        Ok(ApiResponse<PagedResponse<PatientBookListItemResponse>>.Success(await service.GetBookPageAsync(query)));

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdatePatientBookStatusRequest request) =>
        Ok(ApiResponse<PatientBookResponse>.Success(await service.UpdateStatusAsync(id, request)));

    [HttpGet("{id:int}/history")]
    public async Task<IActionResult> GetHistory(int id) =>
        Ok(ApiResponse<List<PatientBookResponse>>.Success(await service.GetHistoryAsync(id)));
}

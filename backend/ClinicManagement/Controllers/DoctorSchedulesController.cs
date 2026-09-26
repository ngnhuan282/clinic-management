using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/doctor-schedules")]
public class DoctorSchedulesController(IDoctorScheduleService service) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> Create(CreateDoctorScheduleRequest request) =>
        Ok(ApiResponse<object>.Success(await service.CreateScheduleAsync(request), "Doctor schedule created"));

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] DateOnly? date,
        [FromQuery] DateOnly? weekStart,
        [FromQuery] int? specializationId) =>
        Ok(ApiResponse<object>.Success(await service.GetSchedulesAsync(date, weekStart, specializationId)));

    [HttpGet("available-slots")]
    [AllowAnonymous]
    public async Task<IActionResult> AvailableSlots([FromQuery] int doctorId, [FromQuery] int? specializationId, [FromQuery] DateOnly date) =>
        Ok(ApiResponse<object>.Success(await service.GetAvailableSlotsAsync(doctorId, specializationId, date)));
}

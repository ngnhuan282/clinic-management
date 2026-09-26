using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/appointments")]
public class AppointmentsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public AppointmentsController(
        IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments()
    {
        var result =
            await _bookingService.GetDepartmentsAsync();

        return Ok(
            ApiResponse<List<DepartmentResponse>>.Success(
                result
            )
        );
    }

    [HttpGet("available-slots")]
    public async Task<IActionResult> GetAvailableSlots(
        [FromQuery] int doctorId,
        [FromQuery] DateTime date)
    {
        var result =
            await _bookingService.GetAvailableSlotsAsync(
                doctorId,
                date
            );

        return Ok(
            ApiResponse<List<AvailableSlotResponse>>.Success(
                result
            )
        );
    }

    [HttpPost]
    [Authorize(Roles = RoleConstants.Patient)]
    public async Task<IActionResult> CreateAppointment(
        CreateAppointmentRequest request)
    {
        var result =
            await _bookingService.CreateAppointmentAsync(
                request
            );

        return Ok(
            ApiResponse<AppointmentResponse>.Success(
                result,
                "Appointment booked successfully"
            )
        );
    }

    [HttpPatch("{appointmentId:int}/start-examination")]
    [Authorize(Roles = RoleConstants.Admin + "," + RoleConstants.Doctor)]
    public async Task<IActionResult> StartExamination(
        int appointmentId)
    {
        var result =
            await _bookingService.StartExaminationAsync(
                appointmentId
            );

        return Ok(
            ApiResponse<AppointmentResponse>.Success(
                result,
                "Appointment examination started successfully"
            )
        );
    }
}

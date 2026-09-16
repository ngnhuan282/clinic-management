using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

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
}

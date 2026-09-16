using ClinicManagement.Commons;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/doctors")]
public class DoctorsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public DoctorsController(
        IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDoctors(
        [FromQuery] int departmentId)
    {
        var result =
            await _bookingService.GetDoctorsByDepartmentAsync(
                departmentId
            );

        return Ok(
            ApiResponse<List<DoctorResponse>>.Success(
                result
            )
        );
    }
}

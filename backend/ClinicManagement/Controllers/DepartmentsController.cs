using ClinicManagement.Commons;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/departments")]
public class DepartmentsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public DepartmentsController(
        IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet]
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
}

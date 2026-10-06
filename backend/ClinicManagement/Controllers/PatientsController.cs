using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/patients")]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;

    public PatientsController(IPatientService patientService) => _patientService = patientService;

    [HttpGet("me")]
    [Authorize(Roles = RoleConstants.Patient)]
    public async Task<IActionResult> GetMyProfile()
    {
        var result = await _patientService.GetMyProfileAsync();
        return Ok(ApiResponse<PatientProfileResponse>.Success(result));
    }

    [HttpPut("me")]
    [Authorize(Roles = RoleConstants.Patient)]
    public async Task<IActionResult> UpdateMyProfile(UpdatePatientProfileRequest request)
    {
        var result = await _patientService.UpdatePatientProfileAsync(request);
        return Ok(ApiResponse<PatientProfileResponse>.Success(result));
    }
}

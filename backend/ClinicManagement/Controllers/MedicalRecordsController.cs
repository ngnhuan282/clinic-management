using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/medical-records")]
[Authorize(Roles = RoleConstants.Admin + "," + RoleConstants.Doctor)]
public class MedicalRecordsController : ControllerBase
{
    private readonly IMedicalRecordService _medicalRecordService;

    public MedicalRecordsController(
        IMedicalRecordService medicalRecordService)
    {
        _medicalRecordService = medicalRecordService;
    }

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue(
        [FromQuery] ExaminationQueueFilterRequest request)
    {
        var result =
            await _medicalRecordService.GetQueueAsync(request);

        return Ok(
            ApiResponse<PagedResponse<ExaminationQueueResponse>>
                .Success(result)
        );
    }

    [HttpGet("{medicalRecordId:int}")]
    public async Task<IActionResult> GetById(
        int medicalRecordId)
    {
        var result =
            await _medicalRecordService.GetByIdAsync(
                medicalRecordId
            );

        return Ok(
            ApiResponse<MedicalRecordResponse>.Success(result)
        );
    }

    [HttpGet("by-appointment/{appointmentId:int}")]
    public async Task<IActionResult> GetByAppointment(
        int appointmentId)
    {
        var result =
            await _medicalRecordService.GetByAppointmentIdAsync(
                appointmentId
            );

        return Ok(
            ApiResponse<MedicalRecordResponse>.Success(result)
        );
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateMedicalRecordRequest request)
    {
        var result =
            await _medicalRecordService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { medicalRecordId = result.MedicalRecordId },
            ApiResponse<MedicalRecordResponse>.Success(
                result,
                "Medical record created successfully"
            )
        );
    }

    [HttpPut("{medicalRecordId:int}")]
    public async Task<IActionResult> Update(
        int medicalRecordId,
        UpdateMedicalRecordRequest request)
    {
        var result =
            await _medicalRecordService.UpdateAsync(
                medicalRecordId,
                request
            );

        return Ok(
            ApiResponse<MedicalRecordResponse>.Success(
                result,
                "Medical record updated successfully"
            )
        );
    }
}

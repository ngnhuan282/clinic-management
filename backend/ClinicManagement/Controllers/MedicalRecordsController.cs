using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/medical-records")]
[Authorize]
public class MedicalRecordsController : ControllerBase
{
    private readonly IMedicalRecordService _medicalRecordService;
    private readonly IMedicalHistoryService _medicalHistoryService;

    public MedicalRecordsController(
        IMedicalRecordService medicalRecordService,
        IMedicalHistoryService medicalHistoryService)
    {
        _medicalRecordService = medicalRecordService;
        _medicalHistoryService = medicalHistoryService;
    }

    [HttpGet("queue")]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<ExaminationQueueResponse>>), StatusCodes.Status200OK)]
    [Authorize(Policy = PermissionCodes.ClinicalViewAssigned)]
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
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordResponse>), StatusCodes.Status200OK)]
    [Authorize(Policy = PermissionCodes.ClinicalViewAssigned)]
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
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordResponse>), StatusCodes.Status200OK)]
    [Authorize(Policy = PermissionCodes.ClinicalViewAssigned)]
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

    [HttpGet("by-appointment/{appointmentId:int}/history/summary")]
    [Authorize(Policy = PermissionCodes.ClinicalViewAssigned)]
    public async Task<IActionResult> GetHistorySummary(int appointmentId) =>
        Ok(ApiResponse<MedicalHistorySummaryResponse>.Success(
            await _medicalHistoryService.GetSummaryAsync(appointmentId)));

    [HttpGet("by-appointment/{appointmentId:int}/history")]
    [Authorize(Policy = PermissionCodes.ClinicalViewAssigned)]
    public async Task<IActionResult> GetHistory(
        int appointmentId, [FromQuery] MedicalHistoryFilterRequest request) =>
        Ok(ApiResponse<PagedResponse<MedicalHistoryListItemResponse>>.Success(
            await _medicalHistoryService.GetHistoryAsync(appointmentId, request)));

    [HttpGet("by-appointment/{appointmentId:int}/history/{medicalRecordId:int}")]
    [Authorize(Policy = PermissionCodes.ClinicalViewAssigned)]
    public async Task<IActionResult> GetHistoryDetail(int appointmentId, int medicalRecordId) =>
        Ok(ApiResponse<MedicalHistoryDetailResponse>.Success(
            await _medicalHistoryService.GetDetailAsync(appointmentId, medicalRecordId)));

    [HttpGet("me/history/summary")]
    [Authorize(Roles = RoleConstants.Patient)]
    public async Task<IActionResult> GetMyHistorySummary() =>
        Ok(ApiResponse<PatientMedicalHistorySummaryResponse>.Success(
            await _medicalHistoryService.GetMySummaryAsync()));

    [HttpGet("me/history")]
    [Authorize(Roles = RoleConstants.Patient)]
    public async Task<IActionResult> GetMyHistory([FromQuery] MedicalHistoryFilterRequest request) =>
        Ok(ApiResponse<PagedResponse<MedicalHistoryListItemResponse>>.Success(
            await _medicalHistoryService.GetMyHistoryAsync(request)));

    [HttpGet("me/history/{medicalRecordId:int}")]
    [Authorize(Roles = RoleConstants.Patient)]
    public async Task<IActionResult> GetMyHistoryDetail(int medicalRecordId) =>
        Ok(ApiResponse<MedicalHistoryDetailResponse>.Success(
            await _medicalHistoryService.GetMyDetailAsync(medicalRecordId)));

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordResponse>), StatusCodes.Status201Created)]
    [Authorize(Policy = PermissionCodes.ClinicalWriteRecord)]
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
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [Authorize(Policy = PermissionCodes.ClinicalEditDiagnosis)]
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

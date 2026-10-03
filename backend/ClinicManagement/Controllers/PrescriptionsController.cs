using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/prescriptions")]
[Authorize]
public class PrescriptionsController : ControllerBase
{
    private readonly IPrescriptionService _prescriptionService;

    public PrescriptionsController(
        IPrescriptionService prescriptionService)
    {
        _prescriptionService = prescriptionService;
    }

    [HttpGet("medicine-options")]
    [Authorize(Policy = PermissionCodes.PharmacyPrescribe)]
    public async Task<IActionResult> GetMedicineOptions()
    {
        var result =
            await _prescriptionService.GetMedicineOptionsAsync();

        return Ok(
            ApiResponse<IReadOnlyList<PrescriptionMedicineOptionResponse>>
                .Success(result)
        );
    }

    [HttpGet("{prescriptionId:int}")]
    [Authorize(Policy = PermissionCodes.PharmacyPrescribe)]
    public async Task<IActionResult> GetById(int prescriptionId)
    {
        var result =
            await _prescriptionService.GetByIdAsync(
                prescriptionId
            );

        return Ok(
            ApiResponse<PrescriptionResponse>.Success(result)
        );
    }

    [HttpGet("by-medical-record/{medicalRecordId:int}")]
    [Authorize(Policy = PermissionCodes.PharmacyPrescribe)]
    public async Task<IActionResult> GetByMedicalRecord(
        int medicalRecordId)
    {
        var result =
            await _prescriptionService.GetByMedicalRecordIdAsync(
                medicalRecordId
            );

        return Ok(
            ApiResponse<PrescriptionResponse?>.Success(result)
        );
    }

    [HttpPost]
    [Authorize(Policy = PermissionCodes.PharmacyPrescribe)]
    public async Task<IActionResult> Create(
        CreatePrescriptionRequest request)
    {
        var result =
            await _prescriptionService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { prescriptionId = result.PrescriptionId },
            ApiResponse<PrescriptionResponse>.Success(
                result,
                "Prescription created successfully"
            )
        );
    }

    [HttpPut("{prescriptionId:int}")]
    [Authorize(Policy = PermissionCodes.PharmacyPrescribe)]
    public async Task<IActionResult> Update(
        int prescriptionId,
        UpdatePrescriptionRequest request)
    {
        var result =
            await _prescriptionService.UpdateAsync(
                prescriptionId,
                request
            );

        return Ok(
            ApiResponse<PrescriptionResponse>.Success(
                result,
                "Prescription updated successfully"
            )
        );
    }

    [HttpPatch("{prescriptionId:int}/cancel")]
    [Authorize(Policy = PermissionCodes.PharmacyPrescribe)]
    public async Task<IActionResult> Cancel(int prescriptionId)
    {
        var result =
            await _prescriptionService.CancelAsync(prescriptionId);

        return Ok(
            ApiResponse<PrescriptionResponse>.Success(
                result,
                "Prescription cancelled successfully"
            )
        );
    }
}

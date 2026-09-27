using ClinicManagement.Commons;
using ClinicManagement.DTOs.LabTests;
using ClinicManagement.DTOs.LabTestResults;
using ClinicManagement.Exceptions;
using ClinicManagement.Services;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LabTestsController(ILabTestService labTests, ICurrentUserService currentUser) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = PermissionCodes.LabsOrder)]
    public async Task<IActionResult> CreateOrder(CreateLabTestDto request) =>
        Ok(await labTests.CreateLabTestAsync(currentUser.GetRequiredUserId(), request));

    [HttpGet("pending")]
    [Authorize(Policy = PermissionCodes.LabsViewPending)]
    public async Task<IActionResult> GetPendingTests() =>
        Ok(await labTests.GetPendingLabTestsAsync());

    [HttpPost("results")]
    [Authorize(Policy = PermissionCodes.LabsEnterResult)]
    public async Task<IActionResult> SubmitResult(CreateLabTestResultDto request) =>
        Ok(await labTests.SubmitResultAsync(currentUser.GetRequiredUserId(), request));

    [HttpGet("{id:int}")]
    [Authorize(Policy = PermissionCodes.LabsViewOrders)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await labTests.GetLabTestByIdAsync(id, currentUser.GetRequiredUserId(), currentUser.Role!);
        if (result == null) throw new AppException(ErrorCode.LAB_TEST_NOT_FOUND);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Policy = PermissionCodes.LabsViewOrders)]
    public async Task<IActionResult> GetOrders() =>
        Ok(await labTests.GetLabTestsAsync(currentUser.GetRequiredUserId(), currentUser.Role!));
}

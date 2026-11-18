using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Services.Implementations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicClinicController(ApplicationDbContext db, ClinicSettingsService clinicSettings) : ControllerBase
{
    [HttpGet("services")]
    public async Task<IActionResult> GetServices(CancellationToken cancellationToken)
    {
        var services = await db.LabTestTypes.AsNoTracking()
            .Where(x => x.IsActive).OrderBy(x => x.Name).ThenBy(x => x.Id)
            .Select(x => new PublicServiceResponse(x.Id, x.Name, x.Description, x.Price))
            .ToListAsync(cancellationToken);
        return Ok(ApiResponse<List<PublicServiceResponse>>.Success(services));
    }

    [HttpGet("clinic-settings")]
    public async Task<IActionResult> GetClinicSettings(CancellationToken cancellationToken) =>
        Ok(ApiResponse<PublicClinicSettingsResponse>.Success(await clinicSettings.GetPublicAsync(cancellationToken)));
}

public record PublicServiceResponse(int Id, string Name, string? Description, decimal Price);

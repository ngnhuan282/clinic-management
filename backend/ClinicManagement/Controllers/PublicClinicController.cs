using ClinicManagement.Commons;
using ClinicManagement.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicClinicController(ApplicationDbContext db) : ControllerBase
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
}

public record PublicServiceResponse(int Id, string Name, string? Description, decimal Price);

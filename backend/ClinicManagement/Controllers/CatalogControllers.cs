using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers;

[ApiController]
public abstract class CatalogControllerBase : ControllerBase { }

[Route("api/departments")]
[Authorize(Roles = RoleConstants.Admin)]
public class DepartmentsController(IDepartmentService service) : CatalogControllerBase
{
    [HttpGet] public async Task<IActionResult> Get([FromQuery] CatalogQuery query) => Ok(ApiResponse<PagedResponse<DepartmentResponse>>.Success(await service.GetAsync(query)));
    [HttpGet("{id:int}")] public async Task<IActionResult> GetById(int id) => Ok(ApiResponse<DepartmentResponse>.Success(await service.GetByIdAsync(id)));
    [HttpPost] public async Task<IActionResult> Create(CreateDepartmentRequest request) => Ok(ApiResponse<DepartmentResponse>.Success(await service.CreateAsync(request), "Department created"));
    [HttpPut("{id:int}")] public async Task<IActionResult> Update(int id, UpdateDepartmentRequest request) => Ok(ApiResponse<DepartmentResponse>.Success(await service.UpdateAsync(id, request), "Department updated"));
    [HttpPatch("{id:int}/status")] public async Task<IActionResult> Status(int id, [FromBody] bool isActive) { await service.UpdateStatusAsync(id, isActive); return Ok(ApiResponse<object>.Success(null, "Department status updated")); }
}

[Route("api/specializations")]
[Authorize(Roles = RoleConstants.Admin)]
public class SpecializationsController(ISpecializationService service) : CatalogControllerBase
{
    [HttpGet] public async Task<IActionResult> Get([FromQuery] CatalogQuery query) => Ok(ApiResponse<PagedResponse<SpecializationResponse>>.Success(await service.GetAsync(query)));
    [HttpGet("{id:int}")] public async Task<IActionResult> GetById(int id) => Ok(ApiResponse<SpecializationResponse>.Success(await service.GetByIdAsync(id)));
    [HttpPost] public async Task<IActionResult> Create(CreateSpecializationRequest request) => Ok(ApiResponse<SpecializationResponse>.Success(await service.CreateAsync(request), "Specialization created"));
    [HttpPut("{id:int}")] public async Task<IActionResult> Update(int id, UpdateSpecializationRequest request) => Ok(ApiResponse<SpecializationResponse>.Success(await service.UpdateAsync(id, request), "Specialization updated"));
    [HttpPatch("{id:int}/status")] public async Task<IActionResult> Status(int id, [FromBody] bool isActive) { await service.UpdateStatusAsync(id, isActive); return Ok(ApiResponse<object>.Success(null, "Specialization status updated")); }
}

[Route("api/rooms")]
[Authorize(Roles = RoleConstants.Admin)]
public class RoomsController(IRoomService service) : CatalogControllerBase
{
    [HttpGet] public async Task<IActionResult> Get([FromQuery] CatalogQuery query) => Ok(ApiResponse<PagedResponse<RoomResponse>>.Success(await service.GetAsync(query)));
    [HttpGet("{id:int}")] public async Task<IActionResult> GetById(int id) => Ok(ApiResponse<RoomResponse>.Success(await service.GetByIdAsync(id)));
    [HttpPost] public async Task<IActionResult> Create(CreateRoomRequest request) => Ok(ApiResponse<RoomResponse>.Success(await service.CreateAsync(request), "Room created"));
    [HttpPut("{id:int}")] public async Task<IActionResult> Update(int id, UpdateRoomRequest request) => Ok(ApiResponse<RoomResponse>.Success(await service.UpdateAsync(id, request), "Room updated"));
    [HttpPatch("{id:int}/status")] public async Task<IActionResult> Status(int id, [FromBody] bool isActive) { await service.UpdateStatusAsync(id, isActive); return Ok(ApiResponse<object>.Success(null, "Room status updated")); }
}

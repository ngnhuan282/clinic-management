using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;
using ClinicManagement.Validators;

namespace ClinicManagement.Services.Implementations;

public class DepartmentService(IDepartmentRepository repository) : IDepartmentService
{
    public async Task<PagedResponse<DepartmentResponse>> GetAsync(CatalogQuery query)
    {
        var (page, size) = CatalogValidators.ValidateQuery(query);
        var result = await repository.GetPageAsync(query);
        return new PagedResponse<DepartmentResponse>(result.Items.Select(x => x.ToResponse()), page, size, result.TotalItems);
    }

    public async Task<DepartmentResponse> GetByIdAsync(int id) =>
        (await repository.GetByIdAsync(id))?.ToResponse() ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);

    public async Task<DepartmentResponse> CreateAsync(CreateDepartmentRequest request)
    {
        var code = CatalogValidators.Required(request.Code);
        var name = CatalogValidators.Required(request.Name);
        if (await repository.ExistsDuplicateAsync(code, name)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        var now = DateTime.UtcNow;
        var entity = new Department { Code = code, Name = name, Description = request.Description?.Trim(), CreatedAt = now, UpdatedAt = now };
        await repository.AddAsync(entity); await repository.SaveChangesAsync();
        return entity.ToResponse();
    }

    public async Task<DepartmentResponse> UpdateAsync(int id, UpdateDepartmentRequest request)
    {
        var entity = await repository.GetByIdAsync(id) ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
        var code = CatalogValidators.Required(request.Code);
        var name = CatalogValidators.Required(request.Name);
        if (await repository.ExistsDuplicateAsync(code, name, id)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        entity.Code = code; entity.Name = name; entity.Description = request.Description?.Trim(); entity.IsActive = request.IsActive; entity.UpdatedAt = DateTime.UtcNow;
        await repository.SaveChangesAsync(); return entity.ToResponse();
    }

    public async Task UpdateStatusAsync(int id, bool isActive)
    {
        var entity = await repository.GetByIdAsync(id) ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
        entity.IsActive = isActive; entity.UpdatedAt = DateTime.UtcNow; await repository.SaveChangesAsync();
    }
}

public class SpecializationService(ISpecializationRepository repository) : ISpecializationService
{
    public async Task<PagedResponse<SpecializationResponse>> GetAsync(CatalogQuery query)
    {
        var (page, size) = CatalogValidators.ValidateQuery(query);
        var result = await repository.GetPageAsync(query);
        return new PagedResponse<SpecializationResponse>(result.Items.Select(x => x.ToResponse()), page, size, result.TotalItems);
    }
    public async Task<SpecializationResponse> GetByIdAsync(int id) =>
        (await repository.GetByIdAsync(id))?.ToResponse() ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
    public async Task<SpecializationResponse> CreateAsync(CreateSpecializationRequest request)
    {
        var code = CatalogValidators.Required(request.Code); var name = CatalogValidators.Required(request.Name); CatalogValidators.ValidateDepartment(request.DepartmentId);
        if (!await repository.DepartmentIsActiveAsync(request.DepartmentId)) throw new AppException(ErrorCode.INVALID_DEPARTMENT);
        if (await repository.ExistsDuplicateAsync(code, name)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        var now = DateTime.UtcNow; var entity = new Specialization { Code = code, Name = name, Description = request.Description?.Trim(), DepartmentId = request.DepartmentId, CreatedAt = now, UpdatedAt = now };
        await repository.AddAsync(entity); await repository.SaveChangesAsync(); return (await repository.GetByIdAsync(entity.SpecializationId))!.ToResponse();
    }
    public async Task<SpecializationResponse> UpdateAsync(int id, UpdateSpecializationRequest request)
    {
        var entity = await repository.GetByIdAsync(id) ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
        var code = CatalogValidators.Required(request.Code); var name = CatalogValidators.Required(request.Name); CatalogValidators.ValidateDepartment(request.DepartmentId);
        if (!await repository.DepartmentIsActiveAsync(request.DepartmentId)) throw new AppException(ErrorCode.INVALID_DEPARTMENT);
        if (await repository.ExistsDuplicateAsync(code, name, id)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        entity.Code = code; entity.Name = name; entity.Description = request.Description?.Trim(); entity.DepartmentId = request.DepartmentId; entity.IsActive = request.IsActive; entity.UpdatedAt = DateTime.UtcNow;
        await repository.SaveChangesAsync(); return entity.ToResponse();
    }
    public async Task UpdateStatusAsync(int id, bool isActive)
    {
        var entity = await repository.GetByIdAsync(id) ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
        entity.IsActive = isActive; entity.UpdatedAt = DateTime.UtcNow; await repository.SaveChangesAsync();
    }
}

public class RoomService(IRoomRepository repository) : IRoomService
{
    public async Task<PagedResponse<RoomResponse>> GetAsync(CatalogQuery query)
    {
        var (page, size) = CatalogValidators.ValidateQuery(query);
        var result = await repository.GetPageAsync(query);
        return new PagedResponse<RoomResponse>(result.Items.Select(x => x.ToResponse()), page, size, result.TotalItems);
    }
    public async Task<RoomResponse> GetByIdAsync(int id) =>
        (await repository.GetByIdAsync(id))?.ToResponse() ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
    public async Task<RoomResponse> CreateAsync(CreateRoomRequest request)
    {
        var number = CatalogValidators.Required(request.RoomNumber); var name = CatalogValidators.Required(request.Name); CatalogValidators.ValidateDepartment(request.DepartmentId);
        if (!await repository.DepartmentIsActiveAsync(request.DepartmentId)) throw new AppException(ErrorCode.INVALID_DEPARTMENT);
        if (await repository.ExistsDuplicateAsync(number)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        var now = DateTime.UtcNow; var entity = new Room { RoomNumber = number, Name = name, RoomType = request.RoomType?.Trim(), DepartmentId = request.DepartmentId, Location = request.Location?.Trim(), CreatedAt = now, UpdatedAt = now };
        await repository.AddAsync(entity); await repository.SaveChangesAsync(); return (await repository.GetByIdAsync(entity.RoomId))!.ToResponse();
    }
    public async Task<RoomResponse> UpdateAsync(int id, UpdateRoomRequest request)
    {
        var entity = await repository.GetByIdAsync(id) ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
        var number = CatalogValidators.Required(request.RoomNumber); var name = CatalogValidators.Required(request.Name); CatalogValidators.ValidateDepartment(request.DepartmentId);
        if (!await repository.DepartmentIsActiveAsync(request.DepartmentId)) throw new AppException(ErrorCode.INVALID_DEPARTMENT);
        if (await repository.ExistsDuplicateAsync(number, id)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        entity.RoomNumber = number; entity.Name = name; entity.RoomType = request.RoomType?.Trim(); entity.DepartmentId = request.DepartmentId; entity.Location = request.Location?.Trim(); entity.IsActive = request.IsActive; entity.UpdatedAt = DateTime.UtcNow;
        await repository.SaveChangesAsync(); return entity.ToResponse();
    }
    public async Task UpdateStatusAsync(int id, bool isActive)
    {
        var entity = await repository.GetByIdAsync(id) ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
        entity.IsActive = isActive; entity.UpdatedAt = DateTime.UtcNow; await repository.SaveChangesAsync();
    }
}

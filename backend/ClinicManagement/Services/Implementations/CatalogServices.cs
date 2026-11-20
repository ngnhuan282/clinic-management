using ClinicManagement.DTOs.Requests.Catalog;
using ClinicManagement.DTOs.Responses.Catalog;
using ClinicManagement.DTOs.Responses.Shared;
using ClinicManagement.Data.Entities;
using ClinicManagement.Exceptions;
using ClinicManagement.Helpers;
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

    public async Task<List<DepartmentResponse>> GetPublicAsync() =>
        (await repository.GetActiveAsync()).Select(x => new DepartmentResponse
        {
            DepartmentId = x.DepartmentId,
            Code = x.Code,
            Name = x.Name,
            Description = x.Description,
            PublicInformation = PublicSpecialtyContent.ForCode(x.Code),
            Specializations = x.Specializations
                .Where(s => s.IsActive)
                .OrderBy(s => s.Name).ThenBy(s => s.SpecializationId)
                .Select(s => new PublicSpecializationResponse
                {
                    SpecializationId = s.SpecializationId,
                    Code = s.Code,
                    Name = s.Name,
                    Description = s.Description,
                    DepartmentId = x.DepartmentId,
                    DepartmentName = x.Name
                }).ToList(),
            IsActive = x.IsActive,
            CreatedAt = x.CreatedAt,
            UpdatedAt = x.UpdatedAt
        }).ToList();

    public async Task<DepartmentResponse> GetByIdAsync(int id) =>
        (await repository.GetByIdAsync(id))?.ToResponse() ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);

    public async Task<DepartmentResponse> CreateAsync(CreateDepartmentRequest request)
    {
        var code = CatalogValidators.Required(request.Code, 30);
        var name = CatalogValidators.Required(request.Name, 150);
        var description = CatalogValidators.Optional(request.Description, 500);
        if (await repository.ExistsDuplicateAsync(code, name)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        var now = DateTime.UtcNow;
        var entity = new Department { Code = code, Name = name, Description = description, CreatedAt = now, UpdatedAt = now };
        await repository.AddAsync(entity); await repository.SaveChangesAsync();
        return entity.ToResponse();
    }

    public async Task<DepartmentResponse> UpdateAsync(int id, UpdateDepartmentRequest request)
    {
        var entity = await repository.GetByIdAsync(id) ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
        var code = CatalogValidators.Required(request.Code, 30);
        var name = CatalogValidators.Required(request.Name, 150);
        var description = CatalogValidators.Optional(request.Description, 500);
        if (await repository.ExistsDuplicateAsync(code, name, id)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        entity.Code = code; entity.Name = name; entity.Description = description; entity.IsActive = request.IsActive; entity.UpdatedAt = DateTime.UtcNow;
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
    public async Task<List<PublicSpecializationResponse>> GetPublicAsync(int? departmentId = null) =>
        (await repository.GetActiveAsync(departmentId)).Select(x => new PublicSpecializationResponse
        {
            SpecializationId = x.SpecializationId,
            Code = x.Code,
            Name = x.Name,
            Description = x.Description,
            DepartmentId = x.DepartmentId,
            DepartmentName = x.Department.Name
        }).ToList();
    public async Task<SpecializationResponse> GetByIdAsync(int id) =>
        (await repository.GetByIdAsync(id))?.ToResponse() ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
    public async Task<SpecializationResponse> CreateAsync(CreateSpecializationRequest request)
    {
        var code = CatalogValidators.Required(request.Code, 30); var name = CatalogValidators.Required(request.Name, 150); var description = CatalogValidators.Optional(request.Description, 500); CatalogValidators.ValidateDepartment(request.DepartmentId);
        if (!await repository.DepartmentIsActiveAsync(request.DepartmentId)) throw new AppException(ErrorCode.INVALID_DEPARTMENT);
        if (await repository.ExistsDuplicateAsync(code, name)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        var now = DateTime.UtcNow; var entity = new Specialization { Code = code, Name = name, Description = description, DepartmentId = request.DepartmentId, CreatedAt = now, UpdatedAt = now };
        await repository.AddAsync(entity); await repository.SaveChangesAsync(); return (await repository.GetByIdAsync(entity.SpecializationId))!.ToResponse();
    }
    public async Task<SpecializationResponse> UpdateAsync(int id, UpdateSpecializationRequest request)
    {
        var entity = await repository.GetByIdAsync(id) ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
        var code = CatalogValidators.Required(request.Code, 30); var name = CatalogValidators.Required(request.Name, 150); var description = CatalogValidators.Optional(request.Description, 500); CatalogValidators.ValidateDepartment(request.DepartmentId);
        if (!await repository.DepartmentIsActiveAsync(request.DepartmentId)) throw new AppException(ErrorCode.INVALID_DEPARTMENT);
        if (await repository.ExistsDuplicateAsync(code, name, id)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        entity.Code = code; entity.Name = name; entity.Description = description; entity.DepartmentId = request.DepartmentId; entity.IsActive = request.IsActive; entity.UpdatedAt = DateTime.UtcNow;
        await repository.SaveChangesAsync(); return (await repository.GetByIdAsync(id))!.ToResponse();
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
    public async Task<List<PublicRoomResponse>> GetPublicAsync() =>
        (await repository.GetActiveAsync()).Select(x => new PublicRoomResponse
        {
            RoomId = x.RoomId,
            RoomCode = x.RoomNumber,
            RoomName = x.Name,
            DepartmentId = x.DepartmentId,
            DepartmentName = x.Department.Name
        }).ToList();
    public async Task<RoomResponse> GetByIdAsync(int id) =>
        (await repository.GetByIdAsync(id))?.ToResponse() ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
    public async Task<RoomResponse> CreateAsync(CreateRoomRequest request)
    {
        var number = CatalogValidators.Required(request.RoomNumber, 30); var name = CatalogValidators.Required(request.Name, 150); var roomType = CatalogValidators.Optional(request.RoomType, 80); var location = CatalogValidators.Optional(request.Location, 150); CatalogValidators.ValidateDepartment(request.DepartmentId);
        if (!await repository.DepartmentIsActiveAsync(request.DepartmentId)) throw new AppException(ErrorCode.INVALID_DEPARTMENT);
        if (await repository.ExistsDuplicateAsync(number)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        var now = DateTime.UtcNow; var entity = new Room { RoomNumber = number, Name = name, RoomType = roomType, DepartmentId = request.DepartmentId, Location = location, CreatedAt = now, UpdatedAt = now };
        await repository.AddAsync(entity); await repository.SaveChangesAsync(); return (await repository.GetByIdAsync(entity.RoomId))!.ToResponse();
    }
    public async Task<RoomResponse> UpdateAsync(int id, UpdateRoomRequest request)
    {
        var entity = await repository.GetByIdAsync(id) ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
        var number = CatalogValidators.Required(request.RoomNumber, 30); var name = CatalogValidators.Required(request.Name, 150); var roomType = CatalogValidators.Optional(request.RoomType, 80); var location = CatalogValidators.Optional(request.Location, 150); CatalogValidators.ValidateDepartment(request.DepartmentId);
        if (!await repository.DepartmentIsActiveAsync(request.DepartmentId)) throw new AppException(ErrorCode.INVALID_DEPARTMENT);
        if (await repository.ExistsDuplicateAsync(number, id)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        entity.RoomNumber = number; entity.Name = name; entity.RoomType = roomType; entity.DepartmentId = request.DepartmentId; entity.Location = location; entity.IsActive = request.IsActive; entity.UpdatedAt = DateTime.UtcNow;
        await repository.SaveChangesAsync(); return (await repository.GetByIdAsync(id))!.ToResponse();
    }
    public async Task UpdateStatusAsync(int id, bool isActive)
    {
        var entity = await repository.GetByIdAsync(id) ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
        entity.IsActive = isActive; entity.UpdatedAt = DateTime.UtcNow; await repository.SaveChangesAsync();
    }
}

public class JobPositionService(IJobPositionRepository repository) : IJobPositionService
{
    public async Task<PagedResponse<JobPositionResponse>> GetAsync(CatalogQuery query)
    {
        var (page, size) = CatalogValidators.ValidateQuery(query);
        var result = await repository.GetPageAsync(query);
        return new PagedResponse<JobPositionResponse>(result.Items.Select(x => x.ToResponse()), page, size, result.TotalItems);
    }

    public async Task<JobPositionResponse> GetByIdAsync(int id) =>
        (await repository.GetByIdAsync(id))?.ToResponse() ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);

    public async Task<JobPositionResponse> CreateAsync(CreateJobPositionRequest request)
    {
        var code = CatalogValidators.Required(request.Code, 20);
        var name = CatalogValidators.Required(request.Name, 100);
        var description = CatalogValidators.Optional(request.Description, 500);
        if (await repository.ExistsDuplicateAsync(code, name)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        var now = DateTime.UtcNow;
        var entity = new JobPosition { Code = code, Name = name, Description = description, CreatedAt = now, UpdatedAt = now };
        await repository.AddAsync(entity); await repository.SaveChangesAsync();
        return entity.ToResponse();
    }

    public async Task<JobPositionResponse> UpdateAsync(int id, UpdateJobPositionRequest request)
    {
        var entity = await repository.GetByIdAsync(id) ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
        var code = CatalogValidators.Required(request.Code, 20);
        var name = CatalogValidators.Required(request.Name, 100);
        var description = CatalogValidators.Optional(request.Description, 500);
        if (await repository.ExistsDuplicateAsync(code, name, id)) throw new AppException(ErrorCode.CATALOG_DUPLICATE);
        entity.Code = code; entity.Name = name; entity.Description = description; entity.IsActive = request.IsActive; entity.UpdatedAt = DateTime.UtcNow;
        await repository.SaveChangesAsync(); return entity.ToResponse();
    }

    public async Task UpdateStatusAsync(int id, bool isActive)
    {
        var entity = await repository.GetByIdAsync(id) ?? throw new AppException(ErrorCode.CATALOG_NOT_FOUND);
        entity.IsActive = isActive; entity.UpdatedAt = DateTime.UtcNow; await repository.SaveChangesAsync();
    }
}

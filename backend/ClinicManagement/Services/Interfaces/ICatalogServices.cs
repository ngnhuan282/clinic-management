using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IDepartmentService
{
    Task<PagedResponse<DepartmentResponse>> GetAsync(CatalogQuery query);
    Task<DepartmentResponse> GetByIdAsync(int id);
    Task<DepartmentResponse> CreateAsync(CreateDepartmentRequest request);
    Task<DepartmentResponse> UpdateAsync(int id, UpdateDepartmentRequest request);
    Task UpdateStatusAsync(int id, bool isActive);
}

public interface ISpecializationService
{
    Task<PagedResponse<SpecializationResponse>> GetAsync(CatalogQuery query);
    Task<SpecializationResponse> GetByIdAsync(int id);
    Task<SpecializationResponse> CreateAsync(CreateSpecializationRequest request);
    Task<SpecializationResponse> UpdateAsync(int id, UpdateSpecializationRequest request);
    Task UpdateStatusAsync(int id, bool isActive);
}

public interface IRoomService
{
    Task<PagedResponse<RoomResponse>> GetAsync(CatalogQuery query);
    Task<RoomResponse> GetByIdAsync(int id);
    Task<RoomResponse> CreateAsync(CreateRoomRequest request);
    Task<RoomResponse> UpdateAsync(int id, UpdateRoomRequest request);
    Task UpdateStatusAsync(int id, bool isActive);
}

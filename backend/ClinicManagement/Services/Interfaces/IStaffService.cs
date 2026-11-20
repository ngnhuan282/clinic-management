using ClinicManagement.DTOs.Requests.Staff;
using ClinicManagement.DTOs.Responses.Shared;
using ClinicManagement.DTOs.Responses.Staff;


namespace ClinicManagement.Services.Interfaces;

public interface IStaffService
{
    Task<PagedResponse<StaffResponse>> GetAsync(StaffQuery query);
    Task<StaffResponse> GetByIdAsync(int staffId);
    Task<StaffResponse> CreateAsync(CreateStaffRequest request);
    Task<StaffResponse> UpdateAsync(int staffId, UpdateStaffRequest request);
    Task UpdateStatusAsync(int staffId, bool isActive);
}

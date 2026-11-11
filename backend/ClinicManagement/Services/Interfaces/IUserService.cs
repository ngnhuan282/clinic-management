using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IUserService
{
    Task<UserResponse> GetMyProfileAsync();
    Task<UserResponse> UpdateMyProfileAsync(UpdateMyProfileRequest request);
    Task<PagedResponse<UserResponse>> GetPageAsync(UserQuery query);
    Task<UserResponse> GetByIdAsync(int userId);
    Task<UserSummaryResponse> GetSummaryAsync(UserQuery query);
    Task<PagedResponse<AccountDoctorResponse>> GetAvailableDoctorsAsync(AvailableDoctorQuery query);
    Task<UserResponse> CreateStaffAsync(CreateStaffUserRequest request);
    Task<UserResponse> UpdateProfileAsync(int userId, UpdateUserProfileRequest request);
    Task<List<RoleResponse>> GetRolesAsync();
    Task<UserResponse> UpdateAccessAsync(int userId, int? roleId, bool? status);
}

using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IDoctorService
{
    Task<PagedResponse<PublicDoctorResponse>> SearchPublicDoctorsAsync(
        PublicDoctorQuery query);

    Task<DoctorProfileResponse> GetMyProfileAsync();

    Task<DoctorProfileResponse> UpdateMyProfileAsync(
        UpdateDoctorProfileRequest request);

    Task<PagedResponse<AdminDoctorResponse>> GetAdminDoctorsAsync(AdminDoctorQuery query);
    Task<AdminDoctorResponse> GetAdminDoctorByIdAsync(int doctorId);
    Task<AdminDoctorResponse> CreateDoctorAsync(CreateDoctorRequest request);
    Task<AdminDoctorResponse> UpdateDoctorAsync(int doctorId, UpdateDoctorRequest request);
    Task UpdateDoctorStatusAsync(int doctorId, bool isActive);
}

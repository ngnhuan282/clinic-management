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
}

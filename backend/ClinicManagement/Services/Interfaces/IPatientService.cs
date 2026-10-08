using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IPatientService
{
    Task<PatientProfileResponse> GetMyProfileAsync();

    Task<PatientProfileResponse> UpdatePatientProfileAsync(
        UpdatePatientProfileRequest request);
}

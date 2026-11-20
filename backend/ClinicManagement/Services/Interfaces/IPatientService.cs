using ClinicManagement.DTOs.Requests.Patients;
using ClinicManagement.DTOs.Responses.Patients;


namespace ClinicManagement.Services.Interfaces;

public interface IPatientService
{
    Task<PatientProfileResponse> GetMyProfileAsync();

    Task<PatientProfileResponse> UpdatePatientProfileAsync(
        UpdatePatientProfileRequest request);

    Task<PatientProfileResponse> CreateMyProfileAsync(UpdatePatientProfileRequest request);
}

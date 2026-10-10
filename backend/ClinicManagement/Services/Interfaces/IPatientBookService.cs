using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IPatientBookService
{
    Task<PagedResponse<PatientBookListItemResponse>> GetBookPageAsync(PatientBookQuery query);

    Task<PatientBookResponse> UpdateStatusAsync(int patientBookId, UpdatePatientBookStatusRequest request);

    Task<List<PatientBookResponse>> GetHistoryAsync(int patientBookId);
}

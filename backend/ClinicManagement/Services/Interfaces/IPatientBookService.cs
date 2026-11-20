using ClinicManagement.DTOs.Requests.PatientBooks;
using ClinicManagement.DTOs.Responses.PatientBooks;
using ClinicManagement.DTOs.Responses.Reception;
using ClinicManagement.DTOs.Responses.Shared;


namespace ClinicManagement.Services.Interfaces;

public interface IPatientBookService
{
    Task<PagedResponse<PatientBookListItemResponse>> GetBookPageAsync(PatientBookQuery query);

    Task<PatientBookResponse> UpdateStatusAsync(int patientBookId, UpdatePatientBookStatusRequest request);

    Task<List<PatientBookResponse>> GetHistoryAsync(int patientBookId);
}

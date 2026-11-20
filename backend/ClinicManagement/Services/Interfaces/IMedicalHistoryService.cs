using ClinicManagement.DTOs.Requests.MedicalHistory;
using ClinicManagement.DTOs.Responses.MedicalHistory;
using ClinicManagement.DTOs.Responses.Shared;


namespace ClinicManagement.Services.Interfaces;

public interface IMedicalHistoryService
{
    Task<MedicalHistorySummaryResponse> GetSummaryAsync(int appointmentId);
    Task<PagedResponse<MedicalHistoryListItemResponse>> GetHistoryAsync(
        int appointmentId, MedicalHistoryFilterRequest request);
    Task<MedicalHistoryDetailResponse> GetDetailAsync(int appointmentId, int medicalRecordId);
    Task<PatientMedicalHistorySummaryResponse> GetMySummaryAsync();
    Task<PagedResponse<MedicalHistoryListItemResponse>> GetMyHistoryAsync(MedicalHistoryFilterRequest request);
    Task<MedicalHistoryDetailResponse> GetMyDetailAsync(int medicalRecordId);
}

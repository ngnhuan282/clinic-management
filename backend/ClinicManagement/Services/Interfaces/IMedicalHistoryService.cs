using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

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

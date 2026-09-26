using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IMedicalRecordService
{
    Task<PagedResponse<ExaminationQueueResponse>> GetQueueAsync(
        ExaminationQueueFilterRequest request);

    Task<MedicalRecordResponse> GetByIdAsync(int medicalRecordId);

    Task<MedicalRecordResponse> GetByAppointmentIdAsync(int appointmentId);

    Task<MedicalRecordResponse> CreateAsync(
        CreateMedicalRecordRequest request);

    Task<MedicalRecordResponse> UpdateAsync(
        int medicalRecordId,
        UpdateMedicalRecordRequest request);
}

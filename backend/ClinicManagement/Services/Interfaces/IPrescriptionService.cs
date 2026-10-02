using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IPrescriptionService
{
    Task<PrescriptionResponse> GetByIdAsync(int prescriptionId);

    Task<PrescriptionResponse?> GetByMedicalRecordIdAsync(
        int medicalRecordId);

    Task<IReadOnlyList<PrescriptionMedicineOptionResponse>>
        GetMedicineOptionsAsync();

    Task<PrescriptionResponse> CreateAsync(
        CreatePrescriptionRequest request);

    Task<PrescriptionResponse> UpdateAsync(
        int prescriptionId,
        UpdatePrescriptionRequest request);

    Task<PrescriptionResponse> CancelAsync(int prescriptionId);
}

using ClinicManagement.DTOs.Requests.Prescriptions;
using ClinicManagement.DTOs.Requests.StockReviews;
using ClinicManagement.DTOs.Responses.Prescriptions;
using ClinicManagement.DTOs.Responses.Shared;
using ClinicManagement.DTOs.Responses.StockReviews;


namespace ClinicManagement.Services.Interfaces;

public interface IPrescriptionService
{
    Task<PagedResponse<DoctorStockReviewListItem>> GetStockReviewsAsync(DoctorStockReviewFilterRequest request);
    Task<DoctorStockReviewResponse> GetStockReviewAsync(int reviewId);
    Task<DoctorStockReviewResponse> RespondToStockReviewAsync(int reviewId, RespondStockReviewRequest request);
    Task<DoctorStockReviewResponse> ApplyStockReviewProposalAsync(int reviewId, ApplyStockReviewProposalRequest request);
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

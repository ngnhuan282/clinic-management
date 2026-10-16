using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;

namespace ClinicManagement.Repositories.Interfaces;

public interface IPrescriptionRepository
{
    Task<(List<PrescriptionStockReview> Items, int Total)> GetStockReviewsAsync(int doctorId, DoctorStockReviewFilterRequest request);
    Task<PrescriptionStockReview?> GetStockReviewAsync(int reviewId, bool tracking = false);
    Task<bool> HasPendingReviewAsync(int prescriptionId);
    Task<Prescription?> GetByIdAsync(int prescriptionId);

    Task<Prescription?> GetByMedicalRecordIdAsync(int medicalRecordId);

    Task<MedicalRecord?> GetMedicalRecordByIdAsync(int medicalRecordId);

    Task<IReadOnlyList<Medicine>> GetMedicineOptionsAsync();

    Task<IReadOnlyList<Medicine>> GetMedicinesByIdsAsync(
        IReadOnlyCollection<int> medicineIds);

    Task AddAsync(Prescription prescription);

    Task<bool> HasMedicineInvoiceAsync(Prescription prescription);

    Task SaveChangesAsync();
}

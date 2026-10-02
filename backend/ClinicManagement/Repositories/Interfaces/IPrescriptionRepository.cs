using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IPrescriptionRepository
{
    Task<Prescription?> GetByIdAsync(int prescriptionId);

    Task<Prescription?> GetByMedicalRecordIdAsync(int medicalRecordId);

    Task<MedicalRecord?> GetMedicalRecordByIdAsync(int medicalRecordId);

    Task<IReadOnlyList<Medicine>> GetMedicineOptionsAsync();

    Task<IReadOnlyList<Medicine>> GetMedicinesByIdsAsync(
        IReadOnlyCollection<int> medicineIds);

    Task AddAsync(Prescription prescription);

    Task SaveChangesAsync();
}

using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;

namespace ClinicManagement.Repositories.Interfaces;

public interface IMedicineRepository
{
    Task<(IEnumerable<Medicine> Items, int TotalItems)> GetPagedAsync(
        MedicineFilterRequest request
    );

    Task<IReadOnlyList<Medicine>> GetAllWithInventoryAsync();

    Task<Medicine?> GetByIdAsync(int medicineId);

    Task<bool> ExistsByNameAsync(
        string medicineName,
        int? excludedMedicineId = null
    );

    Task AddAsync(Medicine medicine);

    void Remove(Medicine medicine);

    Task SaveChangesAsync();
}

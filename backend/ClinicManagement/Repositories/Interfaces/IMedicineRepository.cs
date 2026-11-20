using ClinicManagement.DTOs.Requests.Medicines;
using ClinicManagement.Data.Entities;

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

    Task<bool> IsReferencedAsync(int medicineId);

    Task AddAsync(Medicine medicine);

    void Remove(Medicine medicine);

    Task SaveChangesAsync();
}

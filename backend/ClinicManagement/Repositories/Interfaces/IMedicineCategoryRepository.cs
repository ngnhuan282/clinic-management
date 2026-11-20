using ClinicManagement.DTOs.Requests.Medicines;
using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IMedicineCategoryRepository
{
    Task<(IEnumerable<MedicineCategory> Items, int TotalItems)>
        GetPagedAsync(MedicineCategoryFilterRequest request);

    Task<IReadOnlyList<MedicineCategory>> GetAllWithMedicinesAsync();

    Task<MedicineCategory?> GetByIdAsync(int categoryId);

    Task<IReadOnlyList<MedicineCategory>> GetOptionsAsync();

    Task<bool> ExistsAsync(int categoryId);

    Task<bool> ExistsByNameAsync(
        string categoryName,
        int? excludedCategoryId = null);

    Task AddAsync(MedicineCategory category);

    void Remove(MedicineCategory category);

    Task SaveChangesAsync();
}

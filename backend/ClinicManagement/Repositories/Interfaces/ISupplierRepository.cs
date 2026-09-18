using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;

namespace ClinicManagement.Repositories.Interfaces;

public interface ISupplierRepository
{
    Task<(IEnumerable<Supplier> Items, int TotalItems)>
        GetPagedAsync(SupplierFilterRequest request);

    Task<IReadOnlyList<Supplier>> GetAllWithMedicinesAsync();

    Task<Supplier?> GetByIdAsync(int supplierId);

    Task<IReadOnlyList<Supplier>> GetOptionsAsync();

    Task<bool> ExistsAsync(int supplierId);

    Task<bool> ExistsByNameAsync(
        string supplierName,
        int? excludedSupplierId = null);

    Task AddAsync(Supplier supplier);

    void Remove(Supplier supplier);

    Task SaveChangesAsync();
}

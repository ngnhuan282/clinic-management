using ClinicManagement.DTOs.Requests.Suppliers;
using ClinicManagement.Data.Entities;

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

    Task<bool> HasPurchaseOrdersAsync(int supplierId);

    Task AddAsync(Supplier supplier);

    void Remove(Supplier supplier);

    Task SaveChangesAsync();
}

using System.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using Microsoft.EntityFrameworkCore.Storage;

namespace ClinicManagement.Repositories.Interfaces;

public interface IPurchaseOrderRepository
{
    Task<(IEnumerable<PurchaseOrder> Items, int TotalItems)> GetPagedAsync(
        PurchaseOrderFilterRequest request
    );

    Task<IReadOnlyList<PurchaseOrder>> GetAllAsync();

    Task<PurchaseOrder?> GetByIdAsync(int purchaseOrderId);

    Task<IReadOnlySet<int>> GetExistingMedicineIdsAsync(
        IEnumerable<int> medicineIds
    );

    Task<bool> AreMedicinesFromSupplierAsync(
        int supplierId,
        IEnumerable<int> medicineIds
    );

    Task<Inventory?> GetInventoryLotAsync(
        int medicineId,
        string batchNumber
    );

    Task AddAsync(PurchaseOrder purchaseOrder);

    Task AddInventoryAsync(Inventory inventory);

    Task SaveChangesAsync();

    Task<IDbContextTransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel
    );
}

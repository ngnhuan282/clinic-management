using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;

namespace ClinicManagement.Repositories.Interfaces;

public interface IInventoryRepository
{
    Task<(IEnumerable<Inventory> Items, int TotalItems)> GetPagedAsync(
        InventoryFilterRequest request
    );

    Task<IReadOnlyList<Inventory>> GetAllAsync();

    Task<Inventory?> GetByIdAsync(int inventoryId);

    Task<bool> ExistsLotAsync(
        int medicineId,
        string batchNumber,
        int? excludedInventoryId = null
    );

    Task<bool> HasDispenseHistoryAsync(int inventoryId);

    Task AddAsync(Inventory inventory);

    void Remove(Inventory inventory);

    Task SaveChangesAsync();
}

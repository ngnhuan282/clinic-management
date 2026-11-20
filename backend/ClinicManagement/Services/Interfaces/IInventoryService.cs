using ClinicManagement.DTOs.Requests.Inventory;
using ClinicManagement.DTOs.Responses.Inventory;
using ClinicManagement.DTOs.Responses.Shared;


namespace ClinicManagement.Services.Interfaces;

public interface IInventoryService
{
    Task<PagedResponse<InventoryResponse>> GetPagedAsync(
        InventoryFilterRequest request
    );

    Task<InventorySummaryResponse> GetSummaryAsync();

    Task<InventoryResponse> GetByIdAsync(int inventoryId);

    Task<InventoryResponse> CreateAsync(
        CreateInventoryRequest request
    );

    Task<InventoryResponse> UpdateAsync(
        int inventoryId,
        UpdateInventoryRequest request
    );

    Task DeleteAsync(int inventoryId);
}

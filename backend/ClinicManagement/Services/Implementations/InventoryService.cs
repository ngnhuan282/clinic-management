using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class InventoryService : IInventoryService
{
    private readonly IInventoryRepository _inventoryRepository;
    private readonly IMedicineRepository _medicineRepository;

    public InventoryService(
        IInventoryRepository inventoryRepository,
        IMedicineRepository medicineRepository)
    {
        _inventoryRepository = inventoryRepository;
        _medicineRepository = medicineRepository;
    }

    public async Task<PagedResponse<InventoryResponse>> GetPagedAsync(
        InventoryFilterRequest request)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var (items, totalItems) =
            await _inventoryRepository.GetPagedAsync(request);

        var responses = items
            .Select(x => x.ToResponse(today))
            .ToList();

        return new PagedResponse<InventoryResponse>(
            responses,
            request.PageNumber,
            request.PageSize,
            totalItems
        );
    }

    public async Task<InventorySummaryResponse> GetSummaryAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var inventoryItems =
            await _inventoryRepository.GetAllAsync();

        var responses = inventoryItems
            .Select(x => x.ToResponse(today))
            .ToList();

        return new InventorySummaryResponse
        {
            TotalBatches = responses.Count,
            TotalQuantity = responses.Sum(x =>
                x.QuantityInStock),
            InStockBatches = responses.Count(x =>
                x.StockStatus == "InStock"),
            LowStockBatches = responses.Count(x =>
                x.StockStatus == "LowStock"),
            OutOfStockBatches = responses.Count(x =>
                x.StockStatus == "OutOfStock"),
            ExpiringSoonBatches = responses.Count(x =>
                x.StockStatus == "ExpiringSoon"),
            ExpiredBatches = responses.Count(x =>
                x.StockStatus == "Expired")
        };
    }

    public async Task<InventoryResponse> GetByIdAsync(
        int inventoryId)
    {
        var inventory =
            await _inventoryRepository.GetByIdAsync(
                inventoryId
            );

        if (inventory == null)
        {
            throw new AppException(
                ErrorCode.INVENTORY_NOT_FOUND
            );
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        return inventory.ToResponse(today);
    }

    public async Task<InventoryResponse> CreateAsync(
        CreateInventoryRequest request)
    {
        await EnsureMedicineExistsAsync(request.MedicineId);
        await EnsureLotAvailableAsync(
            request.MedicineId,
            request.BatchNumber,
            request.ExpiryDate
        );

        var inventory = new Inventory
        {
            MedicineId = request.MedicineId,
            BatchNumber = request.BatchNumber.Trim(),
            QuantityInStock = request.QuantityInStock,
            ExpiryDate = request.ExpiryDate
        };

        await _inventoryRepository.AddAsync(inventory);
        await _inventoryRepository.SaveChangesAsync();

        return await GetByIdAsync(inventory.InventoryId);
    }

    public async Task<InventoryResponse> UpdateAsync(
        int inventoryId,
        UpdateInventoryRequest request)
    {
        var inventory =
            await _inventoryRepository.GetByIdAsync(
                inventoryId
            );

        if (inventory == null)
        {
            throw new AppException(
                ErrorCode.INVENTORY_NOT_FOUND
            );
        }

        await EnsureMedicineExistsAsync(request.MedicineId);
        await EnsureLotAvailableAsync(
            request.MedicineId,
            request.BatchNumber,
            request.ExpiryDate,
            inventoryId
        );

        inventory.MedicineId = request.MedicineId;
        inventory.BatchNumber = request.BatchNumber.Trim();
        inventory.QuantityInStock = request.QuantityInStock;
        inventory.ExpiryDate = request.ExpiryDate;

        await _inventoryRepository.SaveChangesAsync();

        return await GetByIdAsync(inventoryId);
    }

    public async Task DeleteAsync(int inventoryId)
    {
        var inventory =
            await _inventoryRepository.GetByIdAsync(
                inventoryId
            );

        if (inventory == null)
        {
            throw new AppException(
                ErrorCode.INVENTORY_NOT_FOUND
            );
        }

        _inventoryRepository.Remove(inventory);
        await _inventoryRepository.SaveChangesAsync();
    }

    private async Task EnsureMedicineExistsAsync(int medicineId)
    {
        var medicine =
            await _medicineRepository.GetByIdAsync(medicineId);

        if (medicine == null)
        {
            throw new AppException(
                ErrorCode.MEDICINE_NOT_FOUND
            );
        }
    }

    private async Task EnsureLotAvailableAsync(
        int medicineId,
        string batchNumber,
        DateOnly expiryDate,
        int? excludedInventoryId = null)
    {
        var exists =
            await _inventoryRepository.ExistsLotAsync(
                medicineId,
                batchNumber,
                expiryDate,
                excludedInventoryId
            );

        if (exists)
        {
            throw new AppException(
                ErrorCode.INVENTORY_LOT_EXISTED
            );
        }
    }
}

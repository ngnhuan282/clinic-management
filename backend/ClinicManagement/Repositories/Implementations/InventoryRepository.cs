using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class InventoryRepository : IInventoryRepository
{
    private readonly ApplicationDbContext _context;

    public InventoryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<Inventory> Items, int TotalItems)> GetPagedAsync(
        InventoryFilterRequest request)
    {
        var query = BuildFilteredQuery(request);

        var totalItems = await query.CountAsync();

        query = ApplySorting(query, request);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return (items, totalItems);
    }

    public async Task<IReadOnlyList<Inventory>> GetAllAsync()
    {
        return await _context.Inventory
            .Include(x => x.Medicine)
                .ThenInclude(x => x.Category)
            .Include(x => x.Medicine)
                .ThenInclude(x => x.Supplier)
            .AsNoTracking()
            .OrderBy(x => x.ExpiryDate)
            .ThenBy(x => x.Medicine.MedicineName)
            .ToListAsync();
    }

    public Task<Inventory?> GetByIdAsync(int inventoryId)
    {
        return _context.Inventory
            .Include(x => x.Medicine)
                .ThenInclude(x => x.Category)
            .Include(x => x.Medicine)
                .ThenInclude(x => x.Supplier)
            .FirstOrDefaultAsync(x =>
                x.InventoryId == inventoryId
            );
    }

    public Task<bool> ExistsLotAsync(
        int medicineId,
        string batchNumber,
        DateOnly expiryDate,
        int? excludedInventoryId = null)
    {
        var normalizedBatch = batchNumber.Trim();

        return _context.Inventory.AnyAsync(x =>
            x.MedicineId == medicineId &&
            x.BatchNumber == normalizedBatch &&
            x.ExpiryDate == expiryDate &&
            (!excludedInventoryId.HasValue ||
                x.InventoryId != excludedInventoryId.Value)
        );
    }

    public async Task AddAsync(Inventory inventory)
    {
        await _context.Inventory.AddAsync(inventory);
    }

    public void Remove(Inventory inventory)
    {
        _context.Inventory.Remove(inventory);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    private IQueryable<Inventory> BuildFilteredQuery(
        InventoryFilterRequest request)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var expiringUntil = today.AddDays(
            MedicineMapping.ExpiringSoonDays
        );

        var query = _context.Inventory
            .Include(x => x.Medicine)
                .ThenInclude(x => x.Category)
            .Include(x => x.Medicine)
                .ThenInclude(x => x.Supplier)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();

            query = query.Where(x =>
                x.BatchNumber.Contains(search) ||
                x.Medicine.MedicineName.Contains(search) ||
                x.Medicine.Unit.Contains(search) ||
                (x.Medicine.Description != null &&
                    x.Medicine.Description.Contains(search)) ||
                x.Medicine.Category.CategoryName.Contains(search) ||
                (x.Medicine.Supplier != null &&
                    x.Medicine.Supplier.SupplierName.Contains(search))
            );
        }

        if (request.MedicineId.HasValue)
        {
            query = query.Where(x =>
                x.MedicineId == request.MedicineId.Value
            );
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(x =>
                x.Medicine.CategoryId == request.CategoryId.Value
            );
        }

        if (request.SupplierId.HasValue)
        {
            query = query.Where(x =>
                x.Medicine.SupplierId == request.SupplierId.Value
            );
        }

        if (!string.IsNullOrWhiteSpace(request.StockStatus))
        {
            query = ApplyStockStatusFilter(
                query,
                request.StockStatus,
                today,
                expiringUntil
            );
        }

        return query;
    }

    private static IQueryable<Inventory> ApplyStockStatusFilter(
        IQueryable<Inventory> query,
        string stockStatus,
        DateOnly today,
        DateOnly expiringUntil)
    {
        var status = stockStatus.Trim();

        return status switch
        {
            "OutOfStock" => query.Where(x =>
                x.QuantityInStock <= 0),

            "Expired" => query.Where(x =>
                x.QuantityInStock > 0 &&
                x.ExpiryDate < today),

            "LowStock" => query.Where(x =>
                x.QuantityInStock > 0 &&
                x.ExpiryDate >= today &&
                x.QuantityInStock <=
                    MedicineMapping.LowStockThreshold),

            "ExpiringSoon" => query.Where(x =>
                x.QuantityInStock >
                    MedicineMapping.LowStockThreshold &&
                x.ExpiryDate >= today &&
                x.ExpiryDate <= expiringUntil),

            "InStock" => query.Where(x =>
                x.QuantityInStock >
                    MedicineMapping.LowStockThreshold &&
                x.ExpiryDate > expiringUntil),

            _ => query
        };
    }

    private static IQueryable<Inventory> ApplySorting(
        IQueryable<Inventory> query,
        InventoryFilterRequest request)
    {
        var isDescending = string.Equals(
            request.SortOrder,
            "desc",
            StringComparison.OrdinalIgnoreCase
        );

        var sortBy = request.SortBy?.Trim().ToLowerInvariant();

        return sortBy switch
        {
            "medicine" => isDescending
                ? query.OrderByDescending(x =>
                        x.Medicine.MedicineName)
                    .ThenBy(x => x.ExpiryDate)
                : query.OrderBy(x => x.Medicine.MedicineName)
                    .ThenBy(x => x.ExpiryDate),

            "quantity" => isDescending
                ? query.OrderByDescending(x =>
                        x.QuantityInStock)
                    .ThenBy(x => x.ExpiryDate)
                : query.OrderBy(x => x.QuantityInStock)
                    .ThenBy(x => x.ExpiryDate),

            "batch" => isDescending
                ? query.OrderByDescending(x => x.BatchNumber)
                    .ThenBy(x => x.Medicine.MedicineName)
                : query.OrderBy(x => x.BatchNumber)
                    .ThenBy(x => x.Medicine.MedicineName),

            _ => isDescending
                ? query.OrderByDescending(x => x.ExpiryDate)
                    .ThenBy(x => x.Medicine.MedicineName)
                : query.OrderBy(x => x.ExpiryDate)
                    .ThenBy(x => x.Medicine.MedicineName)
        };
    }
}

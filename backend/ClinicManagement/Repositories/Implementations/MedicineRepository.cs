using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class MedicineRepository : IMedicineRepository
{
    private readonly ApplicationDbContext _context;

    public MedicineRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<Medicine> Items, int TotalItems)> GetPagedAsync(
        MedicineFilterRequest request)
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

    public async Task<IReadOnlyList<Medicine>> GetAllWithInventoryAsync()
    {
        return await _context.Medicines
            .Include(x => x.Category)
            .Include(x => x.Supplier)
            .Include(x => x.Inventories)
            .AsNoTracking()
            .OrderBy(x => x.MedicineName)
            .ToListAsync();
    }

    public Task<Medicine?> GetByIdAsync(int medicineId)
    {
        return _context.Medicines
            .Include(x => x.Category)
            .Include(x => x.Supplier)
            .Include(x => x.Inventories)
            .FirstOrDefaultAsync(x => x.MedicineId == medicineId);
    }

    public Task<bool> ExistsByNameAsync(
        string medicineName,
        int? excludedMedicineId = null)
    {
        var normalizedName = medicineName.Trim();

        return _context.Medicines.AnyAsync(x =>
            x.MedicineName == normalizedName &&
            (!excludedMedicineId.HasValue ||
                x.MedicineId != excludedMedicineId.Value)
        );
    }

    public async Task AddAsync(Medicine medicine)
    {
        await _context.Medicines.AddAsync(medicine);
    }

    public void Remove(Medicine medicine)
    {
        _context.Medicines.Remove(medicine);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    private IQueryable<Medicine> BuildFilteredQuery(
        MedicineFilterRequest request)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var expiringUntil = today.AddDays(MedicineMapping.ExpiringSoonDays);

        var query = _context.Medicines
            .Include(x => x.Category)
            .Include(x => x.Supplier)
            .Include(x => x.Inventories)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();

            query = query.Where(x =>
                x.MedicineName.Contains(search) ||
                x.Unit.Contains(search) ||
                (x.Description != null &&
                    x.Description.Contains(search)) ||
                x.Category.CategoryName.Contains(search) ||
                (x.Supplier != null &&
                    x.Supplier.SupplierName.Contains(search))
            );
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(x =>
                x.CategoryId == request.CategoryId.Value
            );
        }

        if (request.SupplierId.HasValue)
        {
            query = query.Where(x =>
                x.SupplierId == request.SupplierId.Value
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

    private static IQueryable<Medicine> ApplyStockStatusFilter(
        IQueryable<Medicine> query,
        string stockStatus,
        DateOnly today,
        DateOnly expiringUntil)
    {
        var status = stockStatus.Trim();

        return status switch
        {
            "OutOfStock" => query.Where(x =>
                !x.Inventories.Any(i => i.QuantityInStock > 0)),

            "Expired" => query.Where(x =>
                x.Inventories.Any(i =>
                    i.QuantityInStock > 0 &&
                    i.ExpiryDate < today)),

            "LowStock" => query.Where(x =>
                !x.Inventories.Any(i =>
                    i.QuantityInStock > 0 &&
                    i.ExpiryDate < today) &&
                (x.Inventories.Sum(i =>
                    (int?)i.QuantityInStock) ?? 0) > 0 &&
                (x.Inventories.Sum(i =>
                    (int?)i.QuantityInStock) ?? 0)
                    <= MedicineMapping.LowStockThreshold),

            "ExpiringSoon" => query.Where(x =>
                !x.Inventories.Any(i =>
                    i.QuantityInStock > 0 &&
                    i.ExpiryDate < today) &&
                (x.Inventories.Sum(i =>
                    (int?)i.QuantityInStock) ?? 0) >
                    MedicineMapping.LowStockThreshold &&
                x.Inventories.Any(i =>
                    i.QuantityInStock > 0 &&
                    i.ExpiryDate >= today &&
                    i.ExpiryDate <= expiringUntil)),

            "InStock" => query.Where(x =>
                !x.Inventories.Any(i =>
                    i.QuantityInStock > 0 &&
                    i.ExpiryDate < today) &&
                !x.Inventories.Any(i =>
                    i.QuantityInStock > 0 &&
                    i.ExpiryDate >= today &&
                    i.ExpiryDate <= expiringUntil) &&
                (x.Inventories.Sum(i =>
                    (int?)i.QuantityInStock) ?? 0) >
                    MedicineMapping.LowStockThreshold),

            _ => query
        };
    }

    private static IQueryable<Medicine> ApplySorting(
        IQueryable<Medicine> query,
        MedicineFilterRequest request)
    {
        var isDescending = string.Equals(
            request.SortOrder,
            "desc",
            StringComparison.OrdinalIgnoreCase
        );

        var sortBy = request.SortBy?.Trim().ToLowerInvariant();

        return sortBy switch
        {
            "category" => isDescending
                ? query.OrderByDescending(x => x.Category.CategoryName)
                    .ThenBy(x => x.MedicineName)
                : query.OrderBy(x => x.Category.CategoryName)
                    .ThenBy(x => x.MedicineName),

            "unitprice" => isDescending
                ? query.OrderByDescending(x => x.UnitPrice)
                    .ThenBy(x => x.MedicineName)
                : query.OrderBy(x => x.UnitPrice)
                    .ThenBy(x => x.MedicineName),

            "stock" => isDescending
                ? query.OrderByDescending(x =>
                    x.Inventories.Sum(i =>
                        (int?)i.QuantityInStock) ?? 0)
                    .ThenBy(x => x.MedicineName)
                : query.OrderBy(x =>
                    x.Inventories.Sum(i =>
                        (int?)i.QuantityInStock) ?? 0)
                    .ThenBy(x => x.MedicineName),

            "expiry" => isDescending
                ? query.OrderByDescending(x =>
                    x.Inventories
                        .Where(i => i.QuantityInStock > 0)
                        .Min(i => (DateOnly?)i.ExpiryDate))
                    .ThenBy(x => x.MedicineName)
                : query.OrderBy(x =>
                    x.Inventories
                        .Where(i => i.QuantityInStock > 0)
                        .Min(i => (DateOnly?)i.ExpiryDate))
                    .ThenBy(x => x.MedicineName),

            _ => isDescending
                ? query.OrderByDescending(x => x.MedicineName)
                : query.OrderBy(x => x.MedicineName)
        };
    }
}

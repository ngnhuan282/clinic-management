using ClinicManagement.DTOs.Requests.Medicines;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Implementations;
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
        var thresholds = await ClinicSettingsService.ReadSnapshotSafeAsync(_context);
        var lowStock = thresholds.LowStockThreshold > 0 ? thresholds.LowStockThreshold : MedicineMapping.LowStockThreshold;
        var nearExpiry = thresholds.NearExpiryDays > 0 ? thresholds.NearExpiryDays : MedicineMapping.ExpiringSoonDays;
        var query = BuildFilteredQuery(request, lowStock, nearExpiry);

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

    public async Task<bool> IsReferencedAsync(int medicineId)
    {
        return await _context.PrescriptionDetails.AnyAsync(x => x.MedicineId == medicineId)
            || await _context.PurchaseOrderDetails.AnyAsync(x => x.MedicineId == medicineId);
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
        MedicineFilterRequest request,
        int lowStockThreshold,
        int expiringSoonDays)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var expiringUntil = today.AddDays(expiringSoonDays);

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
                expiringUntil,
                lowStockThreshold
            );
        }

        return query;
    }

    private static IQueryable<Medicine> ApplyStockStatusFilter(
        IQueryable<Medicine> query,
        string stockStatus,
        DateOnly today,
        DateOnly expiringUntil,
        int lowStockThreshold)
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
                    <= lowStockThreshold),

            "ExpiringSoon" => query.Where(x =>
                !x.Inventories.Any(i =>
                    i.QuantityInStock > 0 &&
                    i.ExpiryDate < today) &&
                (x.Inventories.Sum(i =>
                    (int?)i.QuantityInStock) ?? 0) >
                    lowStockThreshold &&
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
                    lowStockThreshold),

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

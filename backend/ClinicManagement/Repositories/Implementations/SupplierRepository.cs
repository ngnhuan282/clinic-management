using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class SupplierRepository : ISupplierRepository
{
    private readonly ApplicationDbContext _context;

    public SupplierRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<Supplier> Items, int TotalItems)>
        GetPagedAsync(SupplierFilterRequest request)
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

    public async Task<IReadOnlyList<Supplier>>
        GetAllWithMedicinesAsync()
    {
        return await _context.Suppliers
            .Include(x => x.Medicines)
            .AsNoTracking()
            .OrderBy(x => x.SupplierName)
            .ToListAsync();
    }

    public Task<Supplier?> GetByIdAsync(int supplierId)
    {
        return _context.Suppliers
            .Include(x => x.Medicines)
            .FirstOrDefaultAsync(x => x.SupplierId == supplierId);
    }

    public async Task<IReadOnlyList<Supplier>> GetOptionsAsync()
    {
        return await _context.Suppliers
            .AsNoTracking()
            .OrderBy(x => x.SupplierName)
            .ToListAsync();
    }

    public Task<bool> ExistsAsync(int supplierId)
    {
        return _context.Suppliers.AnyAsync(
            x => x.SupplierId == supplierId
        );
    }

    public Task<bool> ExistsByNameAsync(
        string supplierName,
        int? excludedSupplierId = null)
    {
        var normalizedName = supplierName.Trim();

        return _context.Suppliers.AnyAsync(x =>
            x.SupplierName == normalizedName &&
            (!excludedSupplierId.HasValue ||
                x.SupplierId != excludedSupplierId.Value)
        );
    }

    public async Task AddAsync(Supplier supplier)
    {
        await _context.Suppliers.AddAsync(supplier);
    }

    public void Remove(Supplier supplier)
    {
        _context.Suppliers.Remove(supplier);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    private IQueryable<Supplier> BuildFilteredQuery(
        SupplierFilterRequest request)
    {
        var query = _context.Suppliers
            .Include(x => x.Medicines)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            var codeSearch = search
                .Replace("NCC-", string.Empty)
                .Trim();

            if (int.TryParse(codeSearch, out var supplierId))
            {
                query = query.Where(x =>
                    x.SupplierName.Contains(search) ||
                    x.SupplierId == supplierId ||
                    (x.ContactInfo != null &&
                        x.ContactInfo.Contains(search)) ||
                    (x.Address != null &&
                        x.Address.Contains(search))
                );
            }
            else
            {
                query = query.Where(x =>
                    x.SupplierName.Contains(search) ||
                    (x.ContactInfo != null &&
                        x.ContactInfo.Contains(search)) ||
                    (x.Address != null &&
                        x.Address.Contains(search))
                );
            }
        }

        if (!string.IsNullOrWhiteSpace(request.UsageStatus))
        {
            query = ApplyUsageStatusFilter(
                query,
                request.UsageStatus
            );
        }

        return query;
    }

    private static IQueryable<Supplier> ApplyUsageStatusFilter(
        IQueryable<Supplier> query,
        string usageStatus)
    {
        return usageStatus.Trim() switch
        {
            "InUse" => query.Where(x => x.Medicines.Any()),
            "Empty" => query.Where(x => !x.Medicines.Any()),
            _ => query
        };
    }

    private static IQueryable<Supplier> ApplySorting(
        IQueryable<Supplier> query,
        SupplierFilterRequest request)
    {
        var isDescending = string.Equals(
            request.SortOrder,
            "desc",
            StringComparison.OrdinalIgnoreCase
        );

        var sortBy = request.SortBy?.Trim().ToLowerInvariant();

        return sortBy switch
        {
            "medicinecount" => isDescending
                ? query.OrderByDescending(x => x.Medicines.Count)
                    .ThenBy(x => x.SupplierName)
                : query.OrderBy(x => x.Medicines.Count)
                    .ThenBy(x => x.SupplierName),

            _ => isDescending
                ? query.OrderByDescending(x => x.SupplierName)
                : query.OrderBy(x => x.SupplierName)
        };
    }
}

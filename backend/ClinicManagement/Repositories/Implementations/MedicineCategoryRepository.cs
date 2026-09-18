using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class MedicineCategoryRepository : IMedicineCategoryRepository
{
    private readonly ApplicationDbContext _context;

    public MedicineCategoryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<MedicineCategory> Items, int TotalItems)>
        GetPagedAsync(MedicineCategoryFilterRequest request)
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

    public async Task<IReadOnlyList<MedicineCategory>>
        GetAllWithMedicinesAsync()
    {
        return await _context.MedicineCategories
            .Include(x => x.Medicines)
            .AsNoTracking()
            .OrderBy(x => x.CategoryName)
            .ToListAsync();
    }

    public Task<MedicineCategory?> GetByIdAsync(int categoryId)
    {
        return _context.MedicineCategories
            .Include(x => x.Medicines)
            .FirstOrDefaultAsync(x => x.CategoryId == categoryId);
    }

    public async Task<IReadOnlyList<MedicineCategory>> GetOptionsAsync()
    {
        return await _context.MedicineCategories
            .AsNoTracking()
            .OrderBy(x => x.CategoryName)
            .ToListAsync();
    }

    public Task<bool> ExistsAsync(int categoryId)
    {
        return _context.MedicineCategories.AnyAsync(
            x => x.CategoryId == categoryId
        );
    }

    public Task<bool> ExistsByNameAsync(
        string categoryName,
        int? excludedCategoryId = null)
    {
        var normalizedName = categoryName.Trim();

        return _context.MedicineCategories.AnyAsync(x =>
            x.CategoryName == normalizedName &&
            (!excludedCategoryId.HasValue ||
                x.CategoryId != excludedCategoryId.Value)
        );
    }

    public async Task AddAsync(MedicineCategory category)
    {
        await _context.MedicineCategories.AddAsync(category);
    }

    public void Remove(MedicineCategory category)
    {
        _context.MedicineCategories.Remove(category);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    private IQueryable<MedicineCategory> BuildFilteredQuery(
        MedicineCategoryFilterRequest request)
    {
        var query = _context.MedicineCategories
            .Include(x => x.Medicines)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            var codeSearch = search
                .Replace("CAT-", string.Empty)
                .Trim();

            if (int.TryParse(codeSearch, out var categoryId))
            {
                query = query.Where(x =>
                    x.CategoryName.Contains(search) ||
                    x.CategoryId == categoryId
                );
            }
            else
            {
                query = query.Where(x =>
                    x.CategoryName.Contains(search)
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

    private static IQueryable<MedicineCategory>
        ApplyUsageStatusFilter(
            IQueryable<MedicineCategory> query,
            string usageStatus)
    {
        return usageStatus.Trim() switch
        {
            "InUse" => query.Where(x => x.Medicines.Any()),
            "Empty" => query.Where(x => !x.Medicines.Any()),
            _ => query
        };
    }

    private static IQueryable<MedicineCategory> ApplySorting(
        IQueryable<MedicineCategory> query,
        MedicineCategoryFilterRequest request)
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
                    .ThenBy(x => x.CategoryName)
                : query.OrderBy(x => x.Medicines.Count)
                    .ThenBy(x => x.CategoryName),

            _ => isDescending
                ? query.OrderByDescending(x => x.CategoryName)
                : query.OrderBy(x => x.CategoryName)
        };
    }
}

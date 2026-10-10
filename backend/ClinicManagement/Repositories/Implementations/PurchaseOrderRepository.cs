using System.Data;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace ClinicManagement.Repositories.Implementations;

public class PurchaseOrderRepository : IPurchaseOrderRepository
{
    private readonly ApplicationDbContext _context;

    public PurchaseOrderRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<PurchaseOrder> Items, int TotalItems)>
        GetPagedAsync(PurchaseOrderFilterRequest request)
    {
        var query = BuildFilteredQuery(request);
        var totalItems = await query.CountAsync();

        var items = await ApplySorting(query, request)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .AsSplitQuery()
            .ToListAsync();

        return (items, totalItems);
    }

    public async Task<IReadOnlyList<PurchaseOrder>> GetAllAsync()
    {
        return await IncludeRelations(_context.PurchaseOrders)
            .AsNoTracking()
            .AsSplitQuery()
            .ToListAsync();
    }

    public Task<PurchaseOrder?> GetByIdAsync(int purchaseOrderId)
    {
        return IncludeRelations(_context.PurchaseOrders)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x =>
                x.PurchaseOrderId == purchaseOrderId);
    }

    public async Task<IReadOnlySet<int>> GetExistingMedicineIdsAsync(
        IEnumerable<int> medicineIds)
    {
        var ids = medicineIds.Distinct().ToArray();

        return (await _context.Medicines
                .Where(x => ids.Contains(x.MedicineId))
                .Select(x => x.MedicineId)
                .ToListAsync())
            .ToHashSet();
    }

    public async Task<bool> AreMedicinesFromSupplierAsync(
        int supplierId,
        IEnumerable<int> medicineIds)
    {
        var ids = medicineIds.Distinct().ToArray();
        var matchingCount = await _context.Medicines.CountAsync(x =>
            ids.Contains(x.MedicineId) &&
            x.SupplierId == supplierId
        );

        return matchingCount == ids.Length;
    }

    public Task<Inventory?> GetInventoryLotAsync(
        int medicineId,
        string batchNumber)
    {
        var normalizedBatch = batchNumber.Trim();

        return _context.Inventory.FirstOrDefaultAsync(x =>
            x.MedicineId == medicineId &&
            x.BatchNumber == normalizedBatch
        );
    }

    public async Task AddAsync(PurchaseOrder purchaseOrder)
    {
        await _context.PurchaseOrders.AddAsync(purchaseOrder);
    }

    public async Task AddInventoryAsync(Inventory inventory)
    {
        await _context.Inventory.AddAsync(inventory);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public Task<IDbContextTransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel)
    {
        return _context.Database.BeginTransactionAsync(isolationLevel);
    }

    private IQueryable<PurchaseOrder> BuildFilteredQuery(
        PurchaseOrderFilterRequest request)
    {
        var query = IncludeRelations(_context.PurchaseOrders)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            var codePart = search.Split('-', StringSplitOptions.RemoveEmptyEntries)
                .LastOrDefault();

            if (int.TryParse(codePart, out var purchaseOrderId))
            {
                query = query.Where(x =>
                    x.PurchaseOrderId == purchaseOrderId ||
                    x.Supplier.SupplierName.Contains(search) ||
                    (x.Notes != null && x.Notes.Contains(search))
                );
            }
            else
            {
                query = query.Where(x =>
                    x.Supplier.SupplierName.Contains(search) ||
                    (x.Notes != null && x.Notes.Contains(search))
                );
            }
        }

        if (request.SupplierId.HasValue)
        {
            query = query.Where(x =>
                x.SupplierId == request.SupplierId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = request.Status.Trim();
            query = query.Where(x => x.Status == status);
        }

        if (request.FromDate.HasValue)
        {
            var from = request.FromDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.OrderDate >= from);
        }

        if (request.ToDate.HasValue)
        {
            var toExclusive = request.ToDate.Value
                .AddDays(1)
                .ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.OrderDate < toExclusive);
        }

        return query;
    }

    private static IQueryable<PurchaseOrder> IncludeRelations(
        IQueryable<PurchaseOrder> query)
    {
        return query
            .Include(x => x.Supplier)
            .Include(x => x.CreatedByUser)
            .Include(x => x.ReceivedByUser)
            .Include(x => x.Details)
                .ThenInclude(x => x.Medicine);
    }

    private static IQueryable<PurchaseOrder> ApplySorting(
        IQueryable<PurchaseOrder> query,
        PurchaseOrderFilterRequest request)
    {
        var descending = !string.Equals(
            request.SortOrder,
            "asc",
            StringComparison.OrdinalIgnoreCase
        );

        return request.SortBy?.Trim().ToLowerInvariant() switch
        {
            "amount" => descending
                ? query.OrderByDescending(x => x.TotalAmount)
                    .ThenByDescending(x => x.OrderDate)
                : query.OrderBy(x => x.TotalAmount)
                    .ThenByDescending(x => x.OrderDate),
            "supplier" => descending
                ? query.OrderByDescending(x => x.Supplier.SupplierName)
                    .ThenByDescending(x => x.OrderDate)
                : query.OrderBy(x => x.Supplier.SupplierName)
                    .ThenByDescending(x => x.OrderDate),
            _ => descending
                ? query.OrderByDescending(x => x.OrderDate)
                    .ThenByDescending(x => x.PurchaseOrderId)
                : query.OrderBy(x => x.OrderDate)
                    .ThenBy(x => x.PurchaseOrderId)
        };
    }
}

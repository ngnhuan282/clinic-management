using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class DiseaseRepository : IDiseaseRepository
{
    private readonly ApplicationDbContext _context;

    public DiseaseRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<Disease> Items, int TotalItems)> GetPagedAsync(
        DiseaseFilterRequest request)
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

    public async Task<IReadOnlyList<Disease>> GetOptionsAsync(
        bool includeInactive = false)
    {
        var query = _context.Diseases
            .AsNoTracking()
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }

        return await query
            .OrderBy(x => x.DiseaseName)
            .ToListAsync();
    }

    public Task<Disease?> GetByIdAsync(int diseaseId)
    {
        return _context.Diseases
            .Include(x => x.RecordDiagnoses)
            .FirstOrDefaultAsync(x => x.DiseaseId == diseaseId);
    }

    public Task<bool> ExistsByCodeAsync(
        string diseaseCode,
        int? excludedDiseaseId = null)
    {
        var normalizedCode = diseaseCode.Trim();

        return _context.Diseases.AnyAsync(x =>
            x.DiseaseCode == normalizedCode &&
            (!excludedDiseaseId.HasValue ||
                x.DiseaseId != excludedDiseaseId.Value)
        );
    }

    public Task<bool> ExistsByNameAsync(
        string diseaseName,
        int? excludedDiseaseId = null)
    {
        var normalizedName = diseaseName.Trim();

        return _context.Diseases.AnyAsync(x =>
            x.DiseaseName == normalizedName &&
            (!excludedDiseaseId.HasValue ||
                x.DiseaseId != excludedDiseaseId.Value)
        );
    }

    public Task<bool> HasDiagnosesAsync(int diseaseId)
    {
        return _context.RecordDiagnoses
            .AnyAsync(x => x.DiseaseId == diseaseId);
    }

    public async Task AddAsync(Disease disease)
    {
        await _context.Diseases.AddAsync(disease);
    }

    public void Remove(Disease disease)
    {
        _context.Diseases.Remove(disease);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    private IQueryable<Disease> BuildFilteredQuery(
        DiseaseFilterRequest request)
    {
        var query = _context.Diseases
            .AsNoTracking()
            .AsQueryable();

        if (!request.IncludeInactive)
        {
            query = query.Where(x => x.IsActive);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(x =>
                x.IsActive == request.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();

            query = query.Where(x =>
                x.DiseaseCode.Contains(search) ||
                x.DiseaseName.Contains(search) ||
                (x.Description != null &&
                    x.Description.Contains(search))
            );
        }

        return query;
    }

    private static IQueryable<Disease> ApplySorting(
        IQueryable<Disease> query,
        DiseaseFilterRequest request)
    {
        var isDescending = string.Equals(
            request.SortOrder,
            "desc",
            StringComparison.OrdinalIgnoreCase
        );

        var sortBy = request.SortBy?.Trim().ToLowerInvariant();

        return sortBy switch
        {
            "code" => isDescending
                ? query.OrderByDescending(x => x.DiseaseCode)
                : query.OrderBy(x => x.DiseaseCode),
            "name" => isDescending
                ? query.OrderByDescending(x => x.DiseaseName)
                : query.OrderBy(x => x.DiseaseName),
            _ => query.OrderBy(x => x.DiseaseName)
        };
    }
}

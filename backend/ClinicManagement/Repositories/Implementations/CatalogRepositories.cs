using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

internal static class CatalogQueryExtensions
{
    public static (int Page, int Size) Normalize(this CatalogQuery query) =>
        (Math.Max(1, query.PageNumber), Math.Clamp(query.PageSize, 1, 100));
}

public class DepartmentRepository(ApplicationDbContext context) : IDepartmentRepository
{
    public async Task<(IReadOnlyList<Department> Items, int TotalItems)> GetPageAsync(CatalogQuery query)
    {
        var (page, size) = query.Normalize();
        var items = context.Departments.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search)) items = items.Where(x => x.Code.Contains(query.Search) || x.Name.Contains(query.Search));
        if (query.IsActive.HasValue) items = items.Where(x => x.IsActive == query.IsActive);
        var total = await items.CountAsync();
        return (await items.OrderBy(x => x.Name).Skip((page - 1) * size).Take(size).ToListAsync(), total);
    }
    public Task<Department?> GetByIdAsync(int id) => context.Departments.FirstOrDefaultAsync(x => x.DepartmentId == id);
    public Task<List<Department>> GetActiveAsync() => context.Departments
        .AsNoTracking()
        .Where(x => x.IsActive)
        .OrderBy(x => x.Name)
        .ToListAsync();
    public Task<bool> ExistsDuplicateAsync(string code, string name, int? excludingId = null) => context.Departments.AnyAsync(x => (excludingId == null || x.DepartmentId != excludingId) && (x.Code == code || x.Name == name));
    public Task AddAsync(Department entity) { context.Departments.Add(entity); return Task.CompletedTask; }
    public Task SaveChangesAsync() => context.SaveChangesAsync();
}

public class SpecializationRepository(ApplicationDbContext context) : ISpecializationRepository
{
    public async Task<(IReadOnlyList<Specialization> Items, int TotalItems)> GetPageAsync(CatalogQuery query)
    {
        var (page, size) = query.Normalize();
        var items = context.Specializations.Include(x => x.Department).AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search)) items = items.Where(x => x.Code.Contains(query.Search) || x.Name.Contains(query.Search));
        if (query.IsActive.HasValue) items = items.Where(x => x.IsActive == query.IsActive);
        var total = await items.CountAsync();
        return (await items.OrderBy(x => x.Name).Skip((page - 1) * size).Take(size).ToListAsync(), total);
    }
    public Task<Specialization?> GetByIdAsync(int id) => context.Specializations.Include(x => x.Department).FirstOrDefaultAsync(x => x.SpecializationId == id);
    public Task<bool> ExistsDuplicateAsync(string code, string name, int? excludingId = null) => context.Specializations.AnyAsync(x => (excludingId == null || x.SpecializationId != excludingId) && (x.Code == code || x.Name == name));
    public Task<bool> DepartmentIsActiveAsync(int departmentId) => context.Departments.AnyAsync(x => x.DepartmentId == departmentId && x.IsActive);
    public Task AddAsync(Specialization entity) { context.Specializations.Add(entity); return Task.CompletedTask; }
    public Task SaveChangesAsync() => context.SaveChangesAsync();
}

public class RoomRepository(ApplicationDbContext context) : IRoomRepository
{
    public async Task<(IReadOnlyList<Room> Items, int TotalItems)> GetPageAsync(CatalogQuery query)
    {
        var (page, size) = query.Normalize();
        var items = context.Rooms.Include(x => x.Department).AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search)) items = items.Where(x => x.RoomNumber.Contains(query.Search) || x.Name.Contains(query.Search));
        if (query.IsActive.HasValue) items = items.Where(x => x.IsActive == query.IsActive);
        var total = await items.CountAsync();
        return (await items.OrderBy(x => x.RoomNumber).Skip((page - 1) * size).Take(size).ToListAsync(), total);
    }
    public Task<Room?> GetByIdAsync(int id) => context.Rooms.Include(x => x.Department).FirstOrDefaultAsync(x => x.RoomId == id);
    public Task<bool> ExistsDuplicateAsync(string roomNumber, int? excludingId = null) => context.Rooms.AnyAsync(x => (excludingId == null || x.RoomId != excludingId) && x.RoomNumber == roomNumber);
    public Task<bool> DepartmentIsActiveAsync(int departmentId) => context.Departments.AnyAsync(x => x.DepartmentId == departmentId && x.IsActive);
    public Task AddAsync(Room entity) { context.Rooms.Add(entity); return Task.CompletedTask; }
    public Task SaveChangesAsync() => context.SaveChangesAsync();
}

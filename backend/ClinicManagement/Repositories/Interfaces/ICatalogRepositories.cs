using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;

namespace ClinicManagement.Repositories.Interfaces;

public interface IDepartmentRepository
{
    Task<(IReadOnlyList<Department> Items, int TotalItems)> GetPageAsync(CatalogQuery query);
    Task<List<Department>> GetActiveAsync();
    Task<Department?> GetByIdAsync(int id);
    Task<bool> ExistsDuplicateAsync(string code, string name, int? excludingId = null);
    Task AddAsync(Department entity);
    Task SaveChangesAsync();
}

public interface ISpecializationRepository
{
    Task<(IReadOnlyList<Specialization> Items, int TotalItems)> GetPageAsync(CatalogQuery query);
    Task<Specialization?> GetByIdAsync(int id);
    Task<bool> ExistsDuplicateAsync(string code, string name, int? excludingId = null);
    Task<bool> DepartmentIsActiveAsync(int departmentId);
    Task AddAsync(Specialization entity);
    Task SaveChangesAsync();
}

public interface IRoomRepository
{
    Task<(IReadOnlyList<Room> Items, int TotalItems)> GetPageAsync(CatalogQuery query);
    Task<Room?> GetByIdAsync(int id);
    Task<bool> ExistsDuplicateAsync(string roomNumber, int? excludingId = null);
    Task<bool> DepartmentIsActiveAsync(int departmentId);
    Task AddAsync(Room entity);
    Task SaveChangesAsync();
}

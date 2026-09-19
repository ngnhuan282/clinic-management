using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IDepartmentRepository
{
    Task<List<Department>> GetActiveAsync();
}

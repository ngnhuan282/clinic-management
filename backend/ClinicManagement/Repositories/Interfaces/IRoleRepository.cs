using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IRoleRepository
{
    Task<Role?> GetByIdAsync(int roleId);
    Task<List<Role>> GetAllAsync();
    Task<Role?> GetByNameAsync(string roleName);
}

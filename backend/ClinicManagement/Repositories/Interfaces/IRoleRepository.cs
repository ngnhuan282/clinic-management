using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IRoleRepository
{
    Task<Role?> GetByNameAsync(string roleName);
}
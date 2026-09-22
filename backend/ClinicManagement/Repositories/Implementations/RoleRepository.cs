using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class RoleRepository : IRoleRepository
{
    private readonly ApplicationDbContext _context;

    public RoleRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<Role?> GetByNameAsync(string roleName)
    {
        return _context.Roles
            .FirstOrDefaultAsync(
                x => x.RoleName == roleName
            );
    }

    public Task<Role?> GetByIdAsync(int roleId) => _context.Roles.SingleOrDefaultAsync(x => x.RoleId == roleId);
    public Task<List<Role>> GetAllAsync() => _context.Roles.AsNoTracking().OrderBy(x => x.RoleId).ToListAsync();
}

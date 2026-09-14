using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<User?> GetByUsernameAsync(string username)
    {
        return _context.Users
            .Include(x => x.Role)
            .FirstOrDefaultAsync(
                x => x.Username == username
            );
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        return _context.Users
            .Include(x => x.Role)
            .FirstOrDefaultAsync(
                x => x.Email == email
            );
    }

    public async Task AddAsync(User user)
    {
        await _context.Users.AddAsync(user);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
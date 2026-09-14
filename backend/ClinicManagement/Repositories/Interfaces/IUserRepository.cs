using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username);

    Task<User?> GetByEmailAsync(string email);

    Task AddAsync(User user);

    Task SaveChangesAsync();
}
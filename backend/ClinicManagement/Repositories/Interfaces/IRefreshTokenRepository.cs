using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByHashAsync(string hash);
    Task AddAsync(RefreshToken token);
    Task SaveChangesAsync();
}

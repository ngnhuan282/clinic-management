using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class RefreshTokenRepository(ApplicationDbContext context) : IRefreshTokenRepository
{
    public Task<RefreshToken?> GetByHashAsync(string hash) => context.RefreshTokens
        .Include(x => x.User).ThenInclude(x => x.Role)
        .SingleOrDefaultAsync(x => x.TokenHash == hash);

    public async Task AddAsync(RefreshToken token) => await context.RefreshTokens.AddAsync(token);
    public async Task SaveChangesAsync() => await context.SaveChangesAsync();
}

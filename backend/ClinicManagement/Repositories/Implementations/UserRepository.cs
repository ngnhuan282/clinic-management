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

    public Task<User?> GetByIdAsync(int userId) =>
        _context.Users.Include(x => x.Role).SingleOrDefaultAsync(x => x.UserId == userId);

    public async Task<(List<User> Items, int Total)> GetPageAsync(ClinicManagement.DTOs.Requests.UserQuery request)
    {
        var query = _context.Users.AsNoTracking().Include(x => x.Role).AsQueryable();
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.Username.Contains(search) || x.FullName.Contains(search)
                || (x.Email != null && x.Email.Contains(search)));
        }
        if (request.RoleId.HasValue) query = query.Where(x => x.RoleId == request.RoleId);
        if (request.Status.HasValue) query = query.Where(x => x.Status == request.Status);
        var total = await query.CountAsync();
        var items = await query.OrderBy(x => x.UserId).Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize).ToListAsync();
        return (items, total);
    }

    public Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginAccessUpdateAsync() =>
        _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

    public Task<int> CountActiveAdminsAsync() => _context.Users.CountAsync(x =>
        x.Status && x.Role.RoleName == ClinicManagement.Commons.RoleConstants.Admin);

    public Task RevokeRefreshTokensAsync(int userId) => _context.RefreshTokens
        .Where(x => x.UserId == userId && x.RevokedAt == null)
        .ExecuteUpdateAsync(update => update.SetProperty(x => x.RevokedAt, DateTime.UtcNow));

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

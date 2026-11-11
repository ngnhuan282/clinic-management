using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

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
        var query = Filter(request).Include(x => x.Role);
        var total = await query.CountAsync();
        var items = await query.OrderBy(x => x.UserId).Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize).ToListAsync();
        return (items, total);
    }

    private IQueryable<User> Filter(UserQuery request)
    {
        var query = _context.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.Username.Contains(search) || x.FullName.Contains(search)
                || (x.Email != null && x.Email.Contains(search))
                || (x.Phone != null && x.Phone.Contains(search)));
        }
        if (request.RoleId.HasValue) query = query.Where(x => x.RoleId == request.RoleId);
        if (request.Status.HasValue) query = query.Where(x => x.Status == request.Status);
        return query;
    }

    public Task<List<UserRoleCountResponse>> GetRoleCountsAsync(UserQuery query) => Filter(query)
        .GroupBy(x => new { x.RoleId, x.Role.RoleName })
        .OrderBy(group => group.Key.RoleId)
        .Select(group => new UserRoleCountResponse(group.Key.RoleId, group.Key.RoleName,
            group.Count(), group.Count(x => x.Status)))
        .ToListAsync();

    public Task<List<AccountDoctorResponse>> GetAccountDoctorsAsync(IEnumerable<int> userIds)
    {
        var ids = userIds.ToArray();
        if (ids.Length == 0) return Task.FromResult(new List<AccountDoctorResponse>());
        return _context.Doctors.AsNoTracking().Where(x => x.UserId.HasValue && ids.Contains(x.UserId.Value))
            .Select(x => new AccountDoctorResponse(x.DoctorId, x.UserId, x.FullName,
                x.Department.Name, x.Specialization.Name)).ToListAsync();
    }

    public async Task<(List<AccountDoctorResponse> Items, int Total)> GetAvailableDoctorsAsync(AvailableDoctorQuery request)
    {
        var query = _context.Doctors.AsNoTracking().Where(x => x.IsActive && x.Department.IsActive
            && x.Specialization.IsActive && x.Specialization.DepartmentId == x.DepartmentId && x.UserId == null);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.FullName.Contains(search) || x.Department.Name.Contains(search));
        }
        var total = await query.CountAsync();
        var items = await query.OrderBy(x => x.FullName).ThenBy(x => x.DoctorId)
            .Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize)
            .Select(x => new AccountDoctorResponse(x.DoctorId, x.UserId, x.FullName,
                x.Department.Name, x.Specialization.Name)).ToListAsync();
        return (items, total);
    }

    public Task<Doctor?> GetDoctorForLinkAsync(int doctorId) => _context.Doctors
        .Include(x => x.Department).Include(x => x.Specialization)
        .SingleOrDefaultAsync(x => x.DoctorId == doctorId && x.IsActive
            && x.Department.IsActive && x.Specialization.IsActive && x.Specialization.DepartmentId == x.DepartmentId);

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

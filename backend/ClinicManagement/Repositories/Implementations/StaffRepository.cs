using ClinicManagement.DTOs.Requests.Staff;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class StaffRepository(ApplicationDbContext context) : IStaffRepository
{
    public async Task<(List<Staff> Items, int Total)> GetPageAsync(StaffQuery query)
    {
        var staff = context.StaffProfiles.AsNoTracking()
            .Include(x => x.JobPosition).Include(x => x.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            staff = staff.Where(x => x.FullName.Contains(search));
        }
        if (query.JobPositionId.HasValue)
            staff = staff.Where(x => x.JobPositionId == query.JobPositionId.Value);

        var total = await staff.CountAsync();
        var items = await staff.OrderBy(x => x.FullName).ThenBy(x => x.StaffId)
            .Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToListAsync();
        return (items, total);
    }

    public Task<Staff?> GetByIdAsync(int staffId) =>
        context.StaffProfiles.Include(x => x.JobPosition).Include(x => x.User)
            .FirstOrDefaultAsync(x => x.StaffId == staffId);

    public Task AddAsync(Staff staff) => context.StaffProfiles.AddAsync(staff).AsTask();

    public Task SaveChangesAsync() => context.SaveChangesAsync();
}

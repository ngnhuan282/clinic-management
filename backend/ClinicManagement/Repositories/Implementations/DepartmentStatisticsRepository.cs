using ClinicManagement.Data;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public sealed class DepartmentStatisticsRepository(ApplicationDbContext db) : IDepartmentStatisticsRepository
{
    public async Task<(int Pending, int Approved)> CountScheduleRequestsAsync(int departmentId,
        DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(departmentId);
        var counts = await db.DoctorScheduleRequests.AsNoTracking()
            .Where(x => x.Doctor.DepartmentId == departmentId
                && x.WorkDate >= fromDate && x.WorkDate <= toDate
                && (x.Status == "Pending" || x.Status == "Approved"))
            .GroupBy(x => 1)
            .Select(group => new
            {
                Pending = group.Count(x => x.Status == "Pending"),
                Approved = group.Count(x => x.Status == "Approved")
            }).SingleOrDefaultAsync(cancellationToken);
        return (counts?.Pending ?? 0, counts?.Approved ?? 0);
    }
}

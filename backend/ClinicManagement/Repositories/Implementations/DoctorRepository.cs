using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class DoctorRepository : IDoctorRepository
{
    public Task<List<DoctorSchedule>> GetSchedulesAsync(int doctorId, DateOnly workDate) =>
        _context.DoctorSchedules.AsNoTracking()
            .Include(x => x.TimeSlots)
            .Where(x => x.DoctorId == doctorId && x.WorkDate == workDate && x.IsActive)
            .OrderBy(x => x.WorkDate).ToListAsync();
    private readonly ApplicationDbContext _context;

    public DoctorRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<List<Doctor>> GetActiveByDepartmentAsync(
        int departmentId)
    {
        return _context.Doctors
            .AsNoTracking()
            .Include(x => x.Department)
            .Where(x =>
                x.IsActive
                && x.DepartmentId == departmentId
                && x.Department.IsActive)
            .OrderBy(x => x.FullName)
            .ToListAsync();
    }

    public Task<Doctor?> GetActiveByIdAsync(
        int doctorId)
    {
        return _context.Doctors
            .AsNoTracking()
            .Include(x => x.Department)
            .FirstOrDefaultAsync(x =>
                x.DoctorId == doctorId
                && x.IsActive
                && x.Department.IsActive);
    }
}

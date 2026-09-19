using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class DoctorRepository : IDoctorRepository
{
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

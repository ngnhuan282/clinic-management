using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class PatientRepository : IPatientRepository
{
    private readonly ApplicationDbContext _context;

    public PatientRepository(ApplicationDbContext context) => _context = context;

    public Task<Patient?> GetByUserIdAsync(
        int userId,
        bool trackChanges = false)
    {
        var query = _context.Patients.Where(x => x.UserId == userId);

        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return query.FirstOrDefaultAsync();
    }

    public Task<bool> HasProfileForUserAsync(int userId) =>
        _context.Patients.AnyAsync(x => x.UserId == userId);

    public Task<bool> IdentityNumberInUseAsync(
        string identityNumber,
        int exceptPatientId) =>
        _context.Patients.AnyAsync(x =>
            x.IdentityNumber == identityNumber && x.PatientId != exceptPatientId);

    public Task SaveChangesAsync() => _context.SaveChangesAsync();
}

using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class PrescriptionRepository : IPrescriptionRepository
{
    private readonly ApplicationDbContext _context;

    public PrescriptionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<Prescription?> GetByIdAsync(int prescriptionId)
    {
        return BuildPrescriptionQuery()
            .FirstOrDefaultAsync(x =>
                x.PrescriptionId == prescriptionId);
    }

    public Task<Prescription?> GetByMedicalRecordIdAsync(
        int medicalRecordId)
    {
        return BuildPrescriptionQuery()
            .FirstOrDefaultAsync(x =>
                x.MedicalRecordId == medicalRecordId);
    }

    public Task<MedicalRecord?> GetMedicalRecordByIdAsync(
        int medicalRecordId)
    {
        return _context.MedicalRecords
            .Include(x => x.Appointment)
            .Include(x => x.Doctor)
            .Include(x => x.Patient)
            .Include(x => x.Prescription)
            .FirstOrDefaultAsync(x =>
                x.MedicalRecordId == medicalRecordId);
    }

    public async Task<IReadOnlyList<Medicine>> GetMedicineOptionsAsync()
    {
        return await _context.Medicines
            .Include(x => x.Category)
            .Include(x => x.Supplier)
            .Include(x => x.Inventories)
            .AsNoTracking()
            .OrderBy(x => x.MedicineName)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Medicine>> GetMedicinesByIdsAsync(
        IReadOnlyCollection<int> medicineIds)
    {
        return await _context.Medicines
            .Include(x => x.Category)
            .Include(x => x.Supplier)
            .Include(x => x.Inventories)
            .Where(x => medicineIds.Contains(x.MedicineId))
            .ToListAsync();
    }

    public async Task AddAsync(Prescription prescription)
    {
        await _context.Prescriptions.AddAsync(prescription);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    private IQueryable<Prescription> BuildPrescriptionQuery()
    {
        return _context.Prescriptions
            .Include(x => x.MedicalRecord)
                .ThenInclude(x => x.Appointment)
            .Include(x => x.MedicalRecord)
                .ThenInclude(x => x.Doctor)
            .Include(x => x.Details)
                .ThenInclude(x => x.Medicine)
                    .ThenInclude(x => x.Category)
            .Include(x => x.Details)
                .ThenInclude(x => x.Medicine)
                    .ThenInclude(x => x.Supplier)
            .Include(x => x.Details)
                .ThenInclude(x => x.Medicine)
                    .ThenInclude(x => x.Inventories);
    }
}

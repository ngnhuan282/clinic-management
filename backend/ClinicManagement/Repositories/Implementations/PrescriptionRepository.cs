using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
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

    public Task<bool> HasMedicineInvoiceAsync(Prescription prescription)
    {
        var detailIds = prescription.Details.Select(x => x.PrescriptionDetailId).ToArray();
        return _context.Invoices.AnyAsync(x => x.AppointmentId == prescription.MedicalRecord.AppointmentId
            && (x.BillingStage == "Medicine" || x.BillingStage == "Final")
            && (x.Status == "Paid" || x.Status == "PartiallyPaid" || x.Status == "Unpaid")
            && x.InvoiceDetails.Any(line =>
                (line.SourceType == "Prescription" && line.SourceId == prescription.PrescriptionId)
                || (line.SourceType == "PrescriptionDetail" && detailIds.Contains(line.SourceId))));
    }

    public Task<bool> HasPendingReviewAsync(int prescriptionId) =>
        _context.PrescriptionStockReviews.AnyAsync(x => x.PrescriptionId == prescriptionId && x.Status == "Pending");

    public async Task<(List<PrescriptionStockReview> Items, int Total)> GetStockReviewsAsync(
        int doctorId, DoctorStockReviewFilterRequest request)
    {
        var query = _context.PrescriptionStockReviews.AsNoTracking()
            .Where(x => x.Prescription.MedicalRecord.DoctorId == doctorId);
        if (!string.IsNullOrWhiteSpace(request.Status)) query = query.Where(x => x.Status == request.Status);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            var numeric = search.Split('-').Last();
            var id = int.TryParse(numeric, out var parsed) ? parsed : -1;
            query = query.Where(x => x.PrescriptionId == id || x.PrescriptionStockReviewId == id
                || x.Prescription.MedicalRecord.Appointment.PatientName.Contains(search)
                || x.Prescription.MedicalRecord.Appointment.PatientPhone.Contains(search));
        }
        var total = await query.CountAsync();
        var items = await query.Include(x => x.Prescription).ThenInclude(x => x.MedicalRecord).ThenInclude(x => x.Appointment)
            .Include(x => x.CreatedByUser).Include(x => x.Decisions)
            .OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.PrescriptionStockReviewId)
            .Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize).AsSplitQuery().ToListAsync();
        return (items, total);
    }

    public Task<PrescriptionStockReview?> GetStockReviewAsync(int reviewId, bool tracking = false)
    {
        var query = _context.PrescriptionStockReviews.AsQueryable();
        if (!tracking) query = query.AsNoTracking();
        return query.Include(x => x.CreatedByUser).Include(x => x.ResolvedByUser)
            .Include(x => x.Decisions).ThenInclude(x => x.DoctorUser)
            .Include(x => x.Prescription).ThenInclude(x => x.MedicalRecord).ThenInclude(x => x.Doctor)
            .Include(x => x.Prescription).ThenInclude(x => x.MedicalRecord).ThenInclude(x => x.Appointment)
            .Include(x => x.Prescription).ThenInclude(x => x.Details).ThenInclude(x => x.Medicine).ThenInclude(x => x.Inventories)
            .AsSplitQuery().SingleOrDefaultAsync(x => x.PrescriptionStockReviewId == reviewId);
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

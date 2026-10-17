using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class MedicalHistoryRepository(ApplicationDbContext db) : IMedicalHistoryRepository
{
    public Task<Appointment?> GetSourceAppointmentAsync(int appointmentId) =>
        db.Appointments.AsNoTracking()
            .Include(x => x.PatientProfile)
            .Include(x => x.PatientBook).ThenInclude(x => x!.Patient)
            .SingleOrDefaultAsync(x => x.AppointmentId == appointmentId);

    public Task<int?> GetDoctorIdAsync(int userId) =>
        db.Doctors.AsNoTracking()
            .Where(x => x.UserId == userId && x.IsActive)
            .Select(x => (int?)x.DoctorId)
            .SingleOrDefaultAsync();

    public async Task<(int TotalVisits, int TotalDoctors, MedicalRecord? LatestRecord)> GetSummaryAsync(
        Patient patient)
    {
        var query = HistoryQuery(patient);
        var totalVisits = await query.CountAsync();
        var totalDoctors = await query.Select(x => x.DoctorId).Distinct().CountAsync();
        var latestRecord = await Ordered(query).FirstOrDefaultAsync();
        return (totalVisits, totalDoctors, latestRecord);
    }

    public Task<int> GetPrescriptionCountAsync(Patient patient) =>
        HistoryQuery(patient).CountAsync(x => x.Prescription != null
            && x.Prescription.Status != PrescriptionStatusConstants.Cancelled);

    public async Task<(IReadOnlyList<MedicalRecord> Items, int TotalItems)> GetHistoryAsync(
        Patient patient, MedicalHistoryFilterRequest request)
    {
        var query = HistoryQuery(patient);
        if (request.FromDate.HasValue)
            query = query.Where(x => x.ExaminationDate.Date >= request.FromDate.Value.Date);
        if (request.ToDate.HasValue)
            query = query.Where(x => x.ExaminationDate.Date <= request.ToDate.Value.Date);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            var code = search.StartsWith("HS-", StringComparison.OrdinalIgnoreCase)
                ? search[3..] : search;
            int? recordId = int.TryParse(code, out var parsedId) ? parsedId : null;
            query = query.Where(x => x.MedicalRecordId == recordId
                || x.Doctor.FullName.Contains(search)
                || x.Doctor.Department.Name.Contains(search)
                || x.Diagnoses.Any(d => d.Disease.DiseaseCode.Contains(search)
                    || d.Disease.DiseaseName.Contains(search)));
        }

        var totalItems = await query.CountAsync();
        var items = await WithDetails(Ordered(query))
            .AsSplitQuery()
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();
        return (items, totalItems);
    }

    public Task<MedicalRecord?> GetHistoryDetailAsync(Patient patient, int medicalRecordId) =>
        WithDetails(HistoryQuery(patient))
            .Include(x => x.PatientBook)
            .Include(x => x.Appointment).ThenInclude(x => x.PatientBook)
            .AsSplitQuery()
            .SingleOrDefaultAsync(x => x.MedicalRecordId == medicalRecordId);

    public async Task<IReadOnlyList<Invoice>> GetMedicineInvoicesAsync(Patient patient, MedicalRecord record)
    {
        if (record.Prescription == null) return [];
        var prescriptionId = record.Prescription.PrescriptionId;
        var detailIds = record.Prescription.Details.Select(x => x.PrescriptionDetailId).ToArray();
        var billingPatientId = record.Appointment.PatientId ?? patient.PatientId;
        return await db.Invoices.AsNoTracking()
            .Include(x => x.InvoiceDetails)
            .Where(x => x.AppointmentId == record.AppointmentId && x.PatientId == billingPatientId
                && (x.BillingStage == "Medicine" || x.BillingStage == "Final")
                && (x.Status == "Paid" || x.Status == "Unpaid")
                && x.InvoiceDetails.Any(line =>
                    (line.SourceType == "Prescription" && line.SourceId == prescriptionId)
                    || (line.SourceType == "PrescriptionDetail" && detailIds.Contains(line.SourceId))))
            .OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
            .ToListAsync();
    }

    private IQueryable<MedicalRecord> HistoryQuery(Patient patient)
    {
        // Older visits may only carry a book or account link; never match patients by name or phone.
        return db.MedicalRecords.AsNoTracking()
            .Where(x => x.Appointment.Status == AppointmentStatusConstants.Completed)
            .Where(x => x.Appointment.PatientProfileId == patient.PatientId
                || (!x.Appointment.PatientProfileId.HasValue
                    && ((x.PatientBook != null && x.PatientBook.PatientId == patient.PatientId)
                        || (!x.PatientBookId.HasValue && x.Appointment.PatientBook != null
                            && x.Appointment.PatientBook.PatientId == patient.PatientId)
                        || (!x.PatientBookId.HasValue && !x.Appointment.PatientBookId.HasValue
                            && patient.UserId.HasValue && x.PatientId == patient.UserId))));
    }

    private static IOrderedQueryable<MedicalRecord> Ordered(IQueryable<MedicalRecord> query) =>
        query.OrderByDescending(x => x.ExaminationDate)
            .ThenByDescending(x => x.Appointment.StartTime)
            .ThenByDescending(x => x.MedicalRecordId);

    private static IQueryable<MedicalRecord> WithDetails(IQueryable<MedicalRecord> query) =>
        query.Include(x => x.Appointment)
            .Include(x => x.Doctor).ThenInclude(x => x.Department)
            .Include(x => x.Diagnoses).ThenInclude(x => x.Disease)
            .Include(x => x.Prescription).ThenInclude(x => x!.Details).ThenInclude(x => x.Medicine);
}

using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class MedicalRecordRepository : IMedicalRecordRepository
{
    private readonly ApplicationDbContext _context;

    public MedicalRecordRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<Appointment> Items, int TotalItems)> GetQueueAsync(
        ExaminationQueueFilterRequest request)
    {
        var query = BuildQueueQuery(request);
        var totalItems = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.StartTime)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return (items, totalItems);
    }

    public Task<Appointment?> GetAppointmentByIdAsync(int appointmentId)
    {
        return _context.Appointments
            .Include(x => x.Doctor)
            .Include(x => x.Patient)
            .Include(x => x.MedicalRecord)
            .FirstOrDefaultAsync(x => x.AppointmentId == appointmentId);
    }

    public Task<MedicalRecord?> GetByIdAsync(int medicalRecordId)
    {
        return BuildRecordQuery()
            .FirstOrDefaultAsync(x =>
                x.MedicalRecordId == medicalRecordId);
    }

    public Task<MedicalRecord?> GetByAppointmentIdAsync(int appointmentId)
    {
        return BuildRecordQuery()
            .FirstOrDefaultAsync(x =>
                x.AppointmentId == appointmentId);
    }

    public async Task AddAsync(MedicalRecord medicalRecord)
    {
        await _context.MedicalRecords.AddAsync(medicalRecord);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    private IQueryable<Appointment> BuildQueueQuery(
        ExaminationQueueFilterRequest request)
    {
        var date = (request.Date ?? DateTime.UtcNow).Date;

        var query = _context.Appointments
            .Include(x => x.Doctor)
            .Include(x => x.Patient)
            .Include(x => x.MedicalRecord)
            .AsNoTracking()
            .Where(x =>
                x.AppointmentDate == date &&
                x.Status != AppointmentStatusConstants.Cancelled)
            .AsQueryable();

        if (request.DoctorId.HasValue)
        {
            query = query.Where(x =>
                x.DoctorId == request.DoctorId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();

            query = query.Where(x =>
                x.PatientName.Contains(search) ||
                x.PatientPhone.Contains(search) ||
                x.AppointmentId.ToString().Contains(search)
            );
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(x => x.Status == request.Status);
        }

        if (!string.IsNullOrWhiteSpace(request.Shift) &&
            !string.Equals(
                request.Shift,
                "all",
                StringComparison.OrdinalIgnoreCase))
        {
            query = request.Shift.Trim().ToLowerInvariant() switch
            {
                "morning" => query.Where(x =>
                    x.StartTime < TimeSpan.FromHours(12)),
                "afternoon" => query.Where(x =>
                    x.StartTime >= TimeSpan.FromHours(12)),
                _ => query
            };
        }

        return query;
    }

    private IQueryable<MedicalRecord> BuildRecordQuery()
    {
        return _context.MedicalRecords
            .Include(x => x.Appointment)
            .Include(x => x.Doctor)
            .Include(x => x.Patient)
            .Include(x => x.Diagnoses)
                .ThenInclude(x => x.Disease);
    }
}

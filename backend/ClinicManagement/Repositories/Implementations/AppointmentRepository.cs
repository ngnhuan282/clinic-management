using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class AppointmentRepository : IAppointmentRepository
{
    private readonly ApplicationDbContext _context;

    public AppointmentRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(List<Appointment> Items, int Total)> GetPageAsync(
        AppointmentQuery request)
    {
        var query = _context.Appointments
            .AsNoTracking()
            .Include(x => x.Doctor)
                .ThenInclude(x => x.Department)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x =>
                x.PatientName.Contains(search)
                || x.PatientPhone.Contains(search)
                || x.Reason.Contains(search)
                || x.Doctor.FullName.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = request.Status.Trim();
            query = query.Where(x => x.Status == status);
        }

        if (request.DateFrom.HasValue)
        {
            var dateFrom = request.DateFrom.Value.Date;
            query = query.Where(x => x.AppointmentDate >= dateFrom);
        }

        if (request.DateTo.HasValue)
        {
            var dateTo = request.DateTo.Value.Date;
            query = query.Where(x => x.AppointmentDate <= dateTo);
        }

        if (request.DoctorId.HasValue)
        {
            query = query.Where(x => x.DoctorId == request.DoctorId.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.AppointmentDate)
            .ThenBy(x => x.StartTime)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return (items, total);
    }

    public Task<Appointment?> GetByIdAsync(int appointmentId)
    {
        return _context.Appointments
            .Include(x => x.Doctor)
                .ThenInclude(x => x.Department)
            .SingleOrDefaultAsync(x => x.AppointmentId == appointmentId);
    }

    public Task<List<Appointment>> GetBookedSlotsAsync(
        int doctorId,
        DateTime appointmentDate)
    {
        var date = appointmentDate.Date;

        return _context.Appointments
            .AsNoTracking()
            .Where(x =>
                x.DoctorId == doctorId
                && x.AppointmentDate == date
                && x.Status != AppointmentStatusConstants.Cancelled)
            .OrderBy(x => x.StartTime)
            .ToListAsync();
    }

    public Task<bool> HasConflictAsync(
        int doctorId,
        DateTime appointmentDate,
        TimeSpan startTime,
        int? ignoredAppointmentId = null)
    {
        var date = appointmentDate.Date;

        return _context.Appointments
            .AsNoTracking()
            .AnyAsync(x =>
                x.DoctorId == doctorId
                && x.AppointmentDate == date
                && x.StartTime == startTime
                && (!ignoredAppointmentId.HasValue || x.AppointmentId != ignoredAppointmentId.Value)
                && x.Status != AppointmentStatusConstants.Cancelled);
    }

    public Task<Appointment?> GetByIdAsync(int appointmentId)
    {
        return _context.Appointments
            .Include(x => x.Doctor)
                .ThenInclude(x => x.Department)
            .FirstOrDefaultAsync(x =>
                x.AppointmentId == appointmentId);
    }

    public async Task AddAsync(
        Appointment appointment)
    {
        await _context.Appointments.AddAsync(
            appointment
        );
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}

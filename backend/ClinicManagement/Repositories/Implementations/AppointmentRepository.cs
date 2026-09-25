using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
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
        TimeSpan startTime)
    {
        var date = appointmentDate.Date;

        return _context.Appointments
            .AsNoTracking()
            .AnyAsync(x =>
                x.DoctorId == doctorId
                && x.AppointmentDate == date
                && x.StartTime == startTime
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

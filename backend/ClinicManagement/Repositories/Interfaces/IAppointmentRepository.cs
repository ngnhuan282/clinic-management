using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IAppointmentRepository
{
    Task<List<Appointment>> GetBookedSlotsAsync(
        int doctorId,
        DateTime appointmentDate);

    Task<bool> HasConflictAsync(
        int doctorId,
        DateTime appointmentDate,
        TimeSpan startTime);

    Task AddAsync(Appointment appointment);

    Task SaveChangesAsync();
}

using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IAppointmentRepository
{
    Task<(List<Appointment> Items, int Total)> GetPageAsync(
        ClinicManagement.DTOs.Requests.AppointmentQuery request);

    Task<Appointment?> GetByIdAsync(int appointmentId);

    Task<List<Appointment>> GetBookedSlotsAsync(
        int doctorId,
        DateTime appointmentDate);

    Task<bool> HasConflictAsync(
        int doctorId,
        DateTime appointmentDate,
        TimeSpan startTime,
        int? ignoredAppointmentId = null);

    Task<Appointment?> GetByIdAsync(int appointmentId);

    Task AddAsync(Appointment appointment);

    Task SaveChangesAsync();
}

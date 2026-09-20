using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IDoctorRepository
{
    Task<List<DoctorSchedule>> GetSchedulesAsync(int doctorId, DayOfWeek dayOfWeek);
    Task<List<Doctor>> GetActiveByDepartmentAsync(
        int departmentId);

    Task<Doctor?> GetActiveByIdAsync(
        int doctorId);
}

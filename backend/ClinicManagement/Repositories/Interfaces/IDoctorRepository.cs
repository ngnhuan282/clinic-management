using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IDoctorRepository
{
    Task<List<Doctor>> GetActiveByDepartmentAsync(
        int departmentId);

    Task<Doctor?> GetActiveByIdAsync(
        int doctorId);
}

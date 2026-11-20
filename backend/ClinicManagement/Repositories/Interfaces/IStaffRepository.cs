using ClinicManagement.DTOs.Requests.Staff;
using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IStaffRepository
{
    Task<(List<Staff> Items, int Total)> GetPageAsync(StaffQuery query);
    Task<Staff?> GetByIdAsync(int staffId);
    Task AddAsync(Staff staff);
    Task SaveChangesAsync();
}

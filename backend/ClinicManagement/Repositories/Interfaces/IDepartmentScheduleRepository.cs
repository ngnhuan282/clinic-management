using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Repositories.Interfaces;

public interface IDepartmentScheduleRepository
{
    Task<int?> GetDepartmentIdAsync(int userId);
    Task<bool> HasDoctorAsync(int departmentId, int doctorId);
    Task<bool> HasRoomAsync(int departmentId, int roomId);
    Task<DepartmentScheduleOptionsResponse> GetOptionsAsync(int departmentId);
    Task<List<DepartmentScheduleResponse>> ListAsync(int departmentId, DateOnly start, DateOnly end, int? doctorId, int? roomId);
}

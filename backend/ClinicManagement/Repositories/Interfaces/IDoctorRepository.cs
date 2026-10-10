using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;

namespace ClinicManagement.Repositories.Interfaces;

public sealed record DoctorRoomRow(int DoctorId, int RoomId, string RoomCode, string RoomName);

public interface IDoctorRepository
{
    Task<List<DoctorSchedule>> GetSchedulesAsync(int doctorId, DateOnly workDate);
    Task<List<Doctor>> GetActiveByDepartmentAsync(
        int departmentId);

    Task<Doctor?> GetActiveByIdAsync(
        int doctorId);

    Task<(List<Doctor> Items, int Total)> GetPublicPageAsync(
        PublicDoctorQuery query,
        DateOnly fromDate);

    Task<List<DoctorRoomRow>> GetUpcomingRoomsAsync(
        List<int> doctorIds,
        DateOnly fromDate);

    Task<Doctor?> GetByUserIdAsync(
        int userId,
        bool trackChanges = false);

    Task SaveChangesAsync();
}

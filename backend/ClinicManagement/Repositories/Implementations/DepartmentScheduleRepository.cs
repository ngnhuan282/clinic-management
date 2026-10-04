using ClinicManagement.Data;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class DepartmentScheduleRepository(ApplicationDbContext db) : IDepartmentScheduleRepository
{
    public Task<int?> GetDepartmentIdAsync(int userId) => db.Doctors.AsNoTracking()
        .Where(x => x.UserId == userId && x.IsActive).Select(x => (int?)x.DepartmentId).SingleOrDefaultAsync();

    public Task<bool> HasDoctorAsync(int departmentId, int doctorId) => db.Doctors
        .AnyAsync(x => x.DoctorId == doctorId && x.DepartmentId == departmentId);

    public Task<bool> HasRoomAsync(int departmentId, int roomId) => db.Rooms
        .AnyAsync(x => x.RoomId == roomId && x.DepartmentId == departmentId);

    public async Task<DepartmentScheduleOptionsResponse> GetOptionsAsync(int departmentId)
    {
        var name = await db.Departments.Where(x => x.DepartmentId == departmentId).Select(x => x.Name).SingleAsync();
        var doctors = await db.Doctors.AsNoTracking().Where(x => x.DepartmentId == departmentId)
            .OrderBy(x => x.FullName).Select(x => new DepartmentScheduleOption(x.DoctorId, x.FullName)).ToListAsync();
        var rooms = await db.Rooms.AsNoTracking().Where(x => x.DepartmentId == departmentId)
            .OrderBy(x => x.Name).Select(x => new DepartmentScheduleOption(x.RoomId, x.Name)).ToListAsync();
        return new(departmentId, name, doctors, rooms);
    }

    public Task<List<DepartmentScheduleResponse>> ListAsync(int departmentId, DateOnly start, DateOnly end, int? doctorId, int? roomId) =>
        db.DoctorSchedules.AsNoTracking().Where(x => x.Doctor.DepartmentId == departmentId
            && x.Room.DepartmentId == departmentId && x.IsActive && x.Status == "Approved"
            && x.WorkDate >= start && x.WorkDate <= end
            && (!doctorId.HasValue || x.DoctorId == doctorId) && (!roomId.HasValue || x.RoomId == roomId))
        .OrderBy(x => x.WorkDate).ThenBy(x => x.StartTime).ThenBy(x => x.ScheduleId)
        .Select(x => new DepartmentScheduleResponse(x.ScheduleId, x.DoctorId, x.Doctor.FullName,
            x.RoomId, x.Room.Name, x.WorkDate, x.StartTime, x.EndTime, x.Shift,
            x.MaxPatients, x.TimeSlots.Sum(s => s.CurrentBooked),
            x.Request != null && x.Request.Reviewer != null ? x.Request.Reviewer.FullName : null,
            x.Request != null ? x.Request.ReviewedAt : null)).ToListAsync();
}

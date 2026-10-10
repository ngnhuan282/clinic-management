using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class DoctorRepository : IDoctorRepository
{
    private const string ApprovedScheduleStatus = "Approved";

    private readonly ApplicationDbContext _context;

    public DoctorRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<List<DoctorSchedule>> GetSchedulesAsync(int doctorId, DateOnly workDate) =>
        _context.DoctorSchedules.AsNoTracking()
            .Include(x => x.TimeSlots)
            .Where(x => x.DoctorId == doctorId && x.WorkDate == workDate && x.IsActive
                && x.Status == ApprovedScheduleStatus)
            .OrderBy(x => x.WorkDate).ToListAsync();

    public Task<List<Doctor>> GetActiveByDepartmentAsync(
        int departmentId)
    {
        return _context.Doctors
            .AsNoTracking()
            .Include(x => x.Department)
            .Where(x =>
                x.IsActive
                && x.DepartmentId == departmentId
                && x.Department.IsActive)
            .OrderBy(x => x.FullName)
            .ToListAsync();
    }

    public Task<Doctor?> GetActiveByIdAsync(
        int doctorId)
    {
        return _context.Doctors
            .AsNoTracking()
            .Include(x => x.Department)
            .FirstOrDefaultAsync(x =>
                x.DoctorId == doctorId
                && x.IsActive
                && x.Department.IsActive);
    }

    public async Task<(List<Doctor> Items, int Total)> GetPublicPageAsync(
        PublicDoctorQuery query,
        DateOnly fromDate)
    {
        var doctors = _context.Doctors
            .AsNoTracking()
            .Include(x => x.Department)
            .Where(x => x.IsActive && x.Department.IsActive);

        if (!string.IsNullOrWhiteSpace(query.FullName))
        {
            var fullName = query.FullName.Trim();
            doctors = doctors.Where(x => x.FullName.Contains(fullName));
        }

        if (query.DepartmentId.HasValue)
        {
            var departmentId = query.DepartmentId.Value;
            doctors = doctors.Where(x => x.DepartmentId == departmentId);
        }

        if (query.RoomId.HasValue)
        {
            var roomId = query.RoomId.Value;
            doctors = doctors.Where(x => _context.DoctorSchedules.Any(s =>
                s.DoctorId == x.DoctorId
                && s.RoomId == roomId
                && s.IsActive
                && s.Status == ApprovedScheduleStatus
                && s.WorkDate >= fromDate));
        }

        var total = await doctors.CountAsync();
        var items = await doctors
            .OrderBy(x => x.FullName)
            .ThenBy(x => x.DoctorId)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<List<DoctorRoomRow>> GetUpcomingRoomsAsync(
        List<int> doctorIds,
        DateOnly fromDate)
    {
        // Distinct runs in SQL on plain columns; the record is built in memory because EF cannot translate
        // Distinct + OrderBy over a constructor projection.
        var rows = await _context.DoctorSchedules
            .AsNoTracking()
            .Where(s => doctorIds.Contains(s.DoctorId)
                && s.IsActive
                && s.Status == ApprovedScheduleStatus
                && s.WorkDate >= fromDate
                && s.Room.IsActive)
            .Select(s => new
            {
                s.DoctorId,
                s.RoomId,
                RoomCode = s.Room.RoomNumber,
                RoomName = s.Room.Name
            })
            .Distinct()
            .ToListAsync();

        return rows
            .OrderBy(x => x.RoomCode)
            .ThenBy(x => x.RoomId)
            .Select(x => new DoctorRoomRow(x.DoctorId, x.RoomId, x.RoomCode, x.RoomName))
            .ToList();
    }

    public Task<Doctor?> GetByUserIdAsync(
        int userId,
        bool trackChanges = false)
    {
        var query = _context.Doctors
            .Include(x => x.Department)
            .Include(x => x.Specialization)
            .Where(x => x.UserId == userId && x.IsActive);

        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return query.FirstOrDefaultAsync();
    }

    public Task SaveChangesAsync() => _context.SaveChangesAsync();
}

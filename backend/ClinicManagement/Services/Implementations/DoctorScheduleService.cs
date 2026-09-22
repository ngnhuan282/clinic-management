using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class DoctorScheduleService(ApplicationDbContext context) : IDoctorScheduleService
{
    private readonly ApplicationDbContext _context = context;

    public async Task<DoctorScheduleResponse> CreateScheduleAsync(CreateDoctorScheduleRequest request)
    {
        if (request.SlotDurationMinutes is not (15 or 20 or 30))
            throw new ArgumentException("Slot duration must be 15, 20, or 30 minutes.");
        if (request.MaxCapacity < 1)
            throw new ArgumentException("Max capacity must be at least 1.");
        if (!TimeSpan.TryParse(request.StartTime, out var start) ||
            !TimeSpan.TryParse(request.EndTime, out var end) || start >= end)
            throw new ArgumentException("StartTime and EndTime must be valid and StartTime must be before EndTime.");

        var doctorExists = await _context.Doctors.AnyAsync(x => x.DoctorId == request.DoctorId && x.IsActive);
        var roomExists = await _context.Rooms.AnyAsync(x => x.RoomId == request.RoomId && x.IsActive);
        if (!doctorExists || !roomExists)
            throw new ArgumentException("The selected doctor or room is not active.");

        var slots = new List<TimeSlot>();
        for (var cursor = start; cursor.Add(TimeSpan.FromMinutes(request.SlotDurationMinutes)) <= end;
             cursor = cursor.Add(TimeSpan.FromMinutes(request.SlotDurationMinutes)))
        {
            slots.Add(new TimeSlot
            {
                StartTime = cursor,
                EndTime = cursor.Add(TimeSpan.FromMinutes(request.SlotDurationMinutes)),
                MaxCapacity = request.MaxCapacity
            });
        }
        if (slots.Count == 0)
            throw new ArgumentException("The selected range must contain at least one complete slot.");

        var schedule = new DoctorSchedule
        {
            DoctorId = request.DoctorId,
            RoomId = request.RoomId,
            WorkDate = request.WorkDate,
            Shift = request.Shift,
            MaxPatients = slots.Count * request.MaxCapacity,
            TimeSlots = slots
        };
        _context.DoctorSchedules.Add(schedule);
        await _context.SaveChangesAsync();
        var created = await GetScheduleQuery().SingleAsync(x => x.ScheduleId == schedule.ScheduleId);
        return MapSchedule(created);
    }

    public async Task<List<DoctorScheduleResponse>> GetSchedulesAsync(DateOnly? date, DateOnly? weekStart, int? specializationId)
    {
        var query = GetScheduleQuery();
        if (date.HasValue) query = query.Where(x => x.WorkDate == date.Value);
        if (weekStart.HasValue)
        {
            var weekEnd = weekStart.Value.AddDays(6);
            query = query.Where(x => x.WorkDate >= weekStart.Value && x.WorkDate <= weekEnd);
        }
        if (specializationId.HasValue)
            query = query.Where(x => x.Doctor.SpecializationId == specializationId.Value);
        var schedules = await query.OrderBy(x => x.WorkDate).ThenBy(x => x.Shift).ToListAsync();
        return schedules.Select(MapSchedule).ToList();
    }

    public Task<List<AvailableSlotResponse>> GetAvailableSlotsAsync(int doctorId, int? specializationId, DateOnly date)
    {
        return _context.TimeSlots.AsNoTracking()
            .Where(x => x.Schedule.DoctorId == doctorId && x.Schedule.WorkDate == date &&
                        x.Schedule.IsActive && x.Schedule.Doctor.IsActive &&
                        (!specializationId.HasValue || x.Schedule.Doctor.SpecializationId == specializationId.Value))
            .OrderBy(x => x.StartTime)
            .Select(x => new AvailableSlotResponse
            {
                SlotId = x.SlotId,
                DoctorName = x.Schedule.Doctor.FullName,
                SpecializationName = x.Schedule.Doctor.Specialization.Name,
                RoomName = x.Schedule.Room.Name,
                StartTime = x.StartTime,
                EndTime = x.EndTime,
                IsAvailable = x.IsAvailable && x.CurrentBooked < x.MaxCapacity
            }).ToListAsync();
    }

    private IQueryable<DoctorSchedule> GetScheduleQuery() =>
        _context.DoctorSchedules.AsNoTracking()
            .Include(x => x.Doctor).Include(x => x.Room).Include(x => x.TimeSlots);

    private static DoctorScheduleResponse MapSchedule(DoctorSchedule x) =>
        new()
        {
            ScheduleId = x.ScheduleId,
            DoctorId = x.DoctorId,
            DoctorName = x.Doctor.FullName,
            RoomId = x.RoomId,
            RoomName = x.Room.Name,
            WorkDate = x.WorkDate,
            Shift = x.Shift,
            MaxPatients = x.MaxPatients,
            IsActive = x.IsActive,
            TotalSlots = x.TimeSlots.Count,
            BookedSlots = x.TimeSlots.Count(s => s.CurrentBooked >= s.MaxCapacity),
            TimeSlots = x.TimeSlots.OrderBy(s => s.StartTime).Select(s => new TimeSlotResponse
            {
                SlotId = s.SlotId, StartTime = s.StartTime.ToString(@"hh\:mm"),
                EndTime = s.EndTime.ToString(@"hh\:mm"), MaxCapacity = s.MaxCapacity,
                CurrentBooked = s.CurrentBooked, IsAvailable = s.IsAvailable && s.CurrentBooked < s.MaxCapacity
            }).ToList()
        };
}

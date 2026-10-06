using System.Data;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class DoctorScheduleService(ApplicationDbContext context, ICurrentUserService currentUser,
    INotificationService notifications) : IDoctorScheduleService
{
    private readonly ApplicationDbContext _context = context;
    private readonly ICurrentUserService _currentUser = currentUser;

    public async Task<ScheduleRequestResponse> CreateRequestAsync(CreateDoctorScheduleRequest request)
    {
        var userId = _currentUser.GetRequiredUserId();
        await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var doctorId = await _context.Doctors.Where(x => x.UserId == userId && x.IsActive)
            .Select(x => (int?)x.DoctorId).SingleOrDefaultAsync()
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
        var validated = await ValidateRequestAsync(request, doctorId);
        var entity = new DoctorScheduleRequest
        {
            DoctorId = doctorId, RoomId = validated.RoomId, WorkDate = validated.WorkDate,
            StartTime = validated.Start, EndTime = validated.End, Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };
        _context.DoctorScheduleRequests.Add(entity);
        await _context.SaveChangesAsync();
        var rows = await notifications.StageAsync(await notifications.ReviewRecipientsAsync(doctorId),
            $"schedule-request:{entity.RequestId}:submitted", "System", "Yêu cầu ca mới",
            $"Yêu cầu ca #{entity.RequestId} ngày {entity.WorkDate:dd/MM/yyyy} đang chờ duyệt.");
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        await notifications.PublishAsync(rows);
        return await ProjectRequest(entity.RequestId);
    }

    public async Task<List<ScheduleRequestResponse>> GetMyRequestsAsync()
    {
        var userId = _currentUser.GetRequiredUserId();
        var doctorId = await _context.Doctors.Where(x => x.UserId == userId)
            .Select(x => (int?)x.DoctorId).SingleOrDefaultAsync()
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
        return await _context.DoctorScheduleRequests.AsNoTracking()
            .Where(x => x.DoctorId == doctorId).OrderByDescending(x => x.CreatedAt)
            .Select(x => new ScheduleRequestResponse
            {
                RequestId = x.RequestId, DoctorId = x.DoctorId, DoctorName = x.Doctor.FullName,
                DepartmentId = x.Doctor.DepartmentId, DepartmentName = x.Doctor.Department.Name,
                RoomId = x.RoomId, RoomName = x.Room.Name, WorkDate = x.WorkDate,
                StartTime = x.StartTime, EndTime = x.EndTime, Status = x.Status,
                ReviewerId = x.ReviewerId, ReviewedAt = x.ReviewedAt, RejectReason = x.RejectReason,
                CreatedAt = x.CreatedAt
            }).ToListAsync();
    }

    public async Task<List<RoomResponse>> GetAvailableRoomsAsync()
    {
        var userId = _currentUser.GetRequiredUserId();
        var departmentId = await _context.Doctors
            .Where(x => x.UserId == userId && x.IsActive)
            .Select(x => (int?)x.DepartmentId)
            .SingleOrDefaultAsync()
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);

        return await _context.Rooms.AsNoTracking()
            .Where(x => x.IsActive && x.Department.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new RoomResponse
            {
                RoomId = x.RoomId,
                RoomNumber = x.RoomNumber,
                Name = x.Name,
                RoomType = x.RoomType,
                DepartmentId = x.DepartmentId,
                DepartmentName = x.Department.Name,
                Location = x.Location,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            }).ToListAsync();
    }

    public async Task<DoctorScheduleResponse> CreateScheduleAsync(CreateDoctorScheduleRequest request)
    {
        if (request.DoctorId is null || request.DoctorId <= 0 || request.RoomId <= 0 || request.WorkDate == default
            || !Enum.IsDefined(request.Shift) || request.SlotDurationMinutes is not (15 or 20 or 30)
            || request.MaxCapacity < 1)
            throw new AppException(ErrorCode.INVALID_REQUEST);
        if (!TimeSpan.TryParse(request.StartTime, out var start) ||
            !TimeSpan.TryParse(request.EndTime, out var end) || start < TimeSpan.Zero
            || start >= end || end > TimeSpan.FromDays(1))
            throw new AppException(ErrorCode.INVALID_REQUEST);

        var doctorExists = await _context.Doctors.AnyAsync(x => x.DoctorId == request.DoctorId && x.IsActive);
        var roomExists = await _context.Rooms.AnyAsync(x => x.RoomId == request.RoomId && x.IsActive);
        if (!doctorExists || !roomExists)
            throw new AppException(ErrorCode.INVALID_REQUEST);

        await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var overlaps = await _context.DoctorSchedules.AnyAsync(x => x.WorkDate == request.WorkDate && x.IsActive
            && (x.DoctorId == request.DoctorId || x.RoomId == request.RoomId)
            && x.StartTime < end && start < x.EndTime);
        if (overlaps) throw new AppException(ErrorCode.DOCTOR_SCHEDULE_CONFLICT);

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
            throw new AppException(ErrorCode.INVALID_REQUEST);

        var schedule = new DoctorSchedule
        {
            DoctorId = request.DoctorId.Value,
            RoomId = request.RoomId,
            WorkDate = request.WorkDate,
            StartTime = start,
            EndTime = end,
            Shift = request.Shift,
            MaxPatients = slots.Count * request.MaxCapacity,
            Status = "Approved",
            TimeSlots = slots
        };
        _context.DoctorSchedules.Add(schedule);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        var created = await GetScheduleQuery().SingleAsync(x => x.ScheduleId == schedule.ScheduleId);
        return MapSchedule(created);
    }

    public async Task<List<DoctorScheduleResponse>> GetSchedulesAsync(DateOnly? date, DateOnly? weekStart, int? specializationId)
    {
        // Only approved, active shifts are published; pending or rejected requests never reach booking or department views.
        var query = GetScheduleQuery()
            .Where(x => x.Status == ScheduleStatusConstants.Approved && x.IsActive);
        if (_currentUser.Role == RoleConstants.DepartmentHead)
        {
            var departmentId = await _context.Doctors.Where(x => x.UserId == _currentUser.GetRequiredUserId() && x.IsActive)
                .Select(x => (int?)x.DepartmentId).SingleOrDefaultAsync()
                ?? throw new AppException(ErrorCode.UNAUTHORIZED);
            query = query.Where(x => x.Doctor.DepartmentId == departmentId && x.Room.DepartmentId == departmentId);
        }
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
                        x.Schedule.IsActive && x.Schedule.Status == "Approved" && x.Schedule.Doctor.IsActive &&
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
            Status = x.Status,
            TotalSlots = x.TimeSlots.Count,
            BookedSlots = x.TimeSlots.Count(s => s.CurrentBooked >= s.MaxCapacity),
            TimeSlots = x.TimeSlots.OrderBy(s => s.StartTime).Select(s => new TimeSlotResponse
            {
                SlotId = s.SlotId, StartTime = s.StartTime.ToString(@"hh\:mm"),
                EndTime = s.EndTime.ToString(@"hh\:mm"), MaxCapacity = s.MaxCapacity,
                CurrentBooked = s.CurrentBooked, IsAvailable = s.IsAvailable && s.CurrentBooked < s.MaxCapacity
            }).ToList()
        };

    private async Task<(int RoomId, DateOnly WorkDate, TimeSpan Start, TimeSpan End)> ValidateRequestAsync(
        CreateDoctorScheduleRequest request, int doctorId)
    {
        if (request.RoomId <= 0 || request.WorkDate == default || !TimeSpan.TryParse(request.StartTime, out var start)
            || !TimeSpan.TryParse(request.EndTime, out var end) || start < TimeSpan.Zero || start >= end
            || end > TimeSpan.FromDays(1) || (end - start).Ticks % TimeSpan.FromMinutes(30).Ticks != 0)
            throw new AppException(ErrorCode.INVALID_REQUEST);
        var valid = await _context.Doctors.AnyAsync(x => x.DoctorId == doctorId && x.IsActive)
            && await _context.Rooms.AnyAsync(x => x.RoomId == request.RoomId && x.IsActive);
        if (!valid) throw new AppException(ErrorCode.INVALID_REQUEST);
        var overlaps = await _context.DoctorScheduleRequests.AnyAsync(x => x.Status == "Pending"
            && x.WorkDate == request.WorkDate && (x.DoctorId == doctorId || x.RoomId == request.RoomId)
            && x.StartTime < end && start < x.EndTime)
            || await _context.DoctorSchedules.AnyAsync(x => x.Status == "Approved" && x.IsActive
            && x.WorkDate == request.WorkDate && (x.DoctorId == doctorId || x.RoomId == request.RoomId)
            && x.StartTime < end && start < x.EndTime);
        if (overlaps) throw new AppException(ErrorCode.DOCTOR_SCHEDULE_CONFLICT);
        return (request.RoomId, request.WorkDate, start, end);
    }

    private async Task<ScheduleRequestResponse> ProjectRequest(int id) =>
        await _context.DoctorScheduleRequests.AsNoTracking()
            .Where(x => x.RequestId == id)
            .Select(x => new ScheduleRequestResponse
            {
                RequestId = x.RequestId, DoctorId = x.DoctorId, DoctorName = x.Doctor.FullName,
                DepartmentId = x.Doctor.DepartmentId, DepartmentName = x.Doctor.Department.Name,
                RoomId = x.RoomId, RoomName = x.Room.Name, WorkDate = x.WorkDate,
                StartTime = x.StartTime, EndTime = x.EndTime, Status = x.Status,
                ReviewerId = x.ReviewerId, ReviewedAt = x.ReviewedAt, RejectReason = x.RejectReason,
                CreatedAt = x.CreatedAt
            }).SingleAsync();
}

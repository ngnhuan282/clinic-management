using System.Data;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class ScheduleReviewService(ApplicationDbContext db, ICurrentUserService currentUser) : IScheduleReviewService
{
    private readonly ApplicationDbContext _db = db;
    private readonly ICurrentUserService _currentUser = currentUser;

    public async Task<PagedResponse<ScheduleRequestResponse>> ListAsync(string? status, int pageNumber, int pageSize)
    {
        var (userId, departmentId, isAdmin) = await ReviewerAsync();
        if (status is not null && status is not ("Pending" or "Approved" or "Rejected" or "Cancelled"))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        var query = _db.DoctorScheduleRequests.AsNoTracking();
        query = isAdmin
            ? query.Where(x => x.Doctor.User != null && x.Doctor.User.Role.RoleName == RoleConstants.DepartmentHead)
            : query.Where(x => x.Doctor.DepartmentId == departmentId);
        if (status is not null) query = query.Where(x => x.Status == status);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.RequestId)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(x => new ScheduleRequestResponse
            {
                RequestId = x.RequestId, DoctorId = x.DoctorId, DoctorName = x.Doctor.FullName,
                DepartmentId = x.Doctor.DepartmentId, DepartmentName = x.Doctor.Department.Name,
                RoomId = x.RoomId, RoomName = x.Room.Name, WorkDate = x.WorkDate,
                StartTime = x.StartTime, EndTime = x.EndTime, Status = x.Status,
                ReviewerId = x.ReviewerId, ReviewedAt = x.ReviewedAt, RejectReason = x.RejectReason,
                CreatedAt = x.CreatedAt,
                CanReview = x.Status == "Pending" && (isAdmin || x.Doctor.UserId != userId)
                    && (isAdmin || x.Doctor.User == null || x.Doctor.User.Role.RoleName != RoleConstants.DepartmentHead)
            }).ToListAsync();
        return new PagedResponse<ScheduleRequestResponse>(items, pageNumber, pageSize, total);
    }

    public async Task<ScheduleRequestResponse> GetAsync(int id)
    {
        var reviewer = await ReviewerAsync();
        var request = await RequestQuery().SingleOrDefaultAsync(x => x.RequestId == id)
            ?? throw new AppException(ErrorCode.SCHEDULE_REQUEST_NOT_FOUND);
        CheckScope(request, reviewer, false);
        return Map(request, reviewer);
    }

    public Task<ScheduleRequestResponse> ApproveAsync(int id) => ReviewAsync(id, null);

    public Task<ScheduleRequestResponse> RejectAsync(int id, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length > 200)
            throw new AppException(ErrorCode.INVALID_REQUEST);
        return ReviewAsync(id, reason.Trim());
    }

    private async Task<ScheduleRequestResponse> ReviewAsync(int id, string? reason)
    {
        var reviewer = await ReviewerAsync();
        try
        {
            await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            var request = await RequestQuery().SingleOrDefaultAsync(x => x.RequestId == id)
                ?? throw new AppException(ErrorCode.SCHEDULE_REQUEST_NOT_FOUND);
            CheckScope(request, reviewer, true);
            if (request.Status != "Pending") throw new AppException(ErrorCode.SCHEDULE_REQUEST_INVALID_STATUS);
            if (request.StartTime >= request.EndTime ||
                (request.EndTime - request.StartTime).Ticks % TimeSpan.FromMinutes(30).Ticks != 0 ||
                request.Doctor.DepartmentId != request.Room.DepartmentId
                || !request.Doctor.IsActive || !request.Room.IsActive)
                throw new AppException(ErrorCode.INVALID_REQUEST);

            if (reason is null)
            {
                var overlaps = await _db.DoctorSchedules.AnyAsync(x => x.IsActive && x.WorkDate == request.WorkDate
                    && (x.DoctorId == request.DoctorId || x.RoomId == request.RoomId)
                    && x.StartTime < request.EndTime && request.StartTime < x.EndTime);
                if (overlaps) throw new AppException(ErrorCode.DOCTOR_SCHEDULE_CONFLICT);
                var slots = new List<TimeSlot>();
                for (var start = request.StartTime; start.Add(TimeSpan.FromMinutes(30)) <= request.EndTime;
                     start = start.Add(TimeSpan.FromMinutes(30)))
                    slots.Add(new TimeSlot { StartTime = start, EndTime = start.Add(TimeSpan.FromMinutes(30)) });
                if (slots.Count == 0) throw new AppException(ErrorCode.INVALID_REQUEST);
                _db.DoctorSchedules.Add(new DoctorSchedule
                {
                    RequestId = request.RequestId, DoctorId = request.DoctorId, RoomId = request.RoomId,
                    WorkDate = request.WorkDate, StartTime = request.StartTime, EndTime = request.EndTime,
                    Shift = request.StartTime.Hours < 12 ? Shift.Morning : request.StartTime.Hours < 17 ? Shift.Afternoon : Shift.Evening,
                    MaxPatients = slots.Count, IsActive = true, CreatedAt = DateTime.UtcNow, TimeSlots = slots
                });
                request.Status = "Approved";
            }
            else
            {
                request.Status = "Rejected";
                request.RejectReason = reason;
            }
            request.ReviewerId = reviewer.UserId;
            request.ReviewedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            return Map(request, reviewer);
        }
        catch (Exception ex) when (IsSqlConflict(ex))
        {
            throw new AppException(ErrorCode.DOCTOR_SCHEDULE_CONFLICT);
        }
    }

    private static bool IsSqlConflict(Exception exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
            if (current is SqlException sql && sql.Number is 1205 or 2601 or 2627)
                return true;
        return false;
    }

    private async Task<(int UserId, int? DepartmentId, bool IsAdmin)> ReviewerAsync()
    {
        var userId = _currentUser.GetRequiredUserId();
        if (_currentUser.Role == RoleConstants.Admin) return (userId, null, true);
        if (_currentUser.Role != RoleConstants.DepartmentHead) throw new AppException(ErrorCode.UNAUTHORIZED);
        var departmentId = await _db.Doctors.AsNoTracking()
            .Where(x => x.UserId == userId && x.IsActive).Select(x => (int?)x.DepartmentId).SingleOrDefaultAsync();
        if (departmentId is null) throw new AppException(ErrorCode.UNAUTHORIZED);
        return (userId, departmentId, false);
    }

    private IQueryable<DoctorScheduleRequest> RequestQuery() => _db.DoctorScheduleRequests
        .Include(x => x.Doctor).ThenInclude(x => x.Department)
        .Include(x => x.Doctor).ThenInclude(x => x.User).ThenInclude(x => x!.Role)
        .Include(x => x.Room);

    private static void CheckScope(DoctorScheduleRequest request, (int UserId, int? DepartmentId, bool IsAdmin) reviewer, bool forReview)
    {
        var isHeadRequest = request.Doctor.User?.Role.RoleName == RoleConstants.DepartmentHead;
        if (reviewer.IsAdmin ? !isHeadRequest
            : request.Doctor.DepartmentId != reviewer.DepartmentId ||
              (forReview && (request.Doctor.UserId == reviewer.UserId || isHeadRequest)))
            throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    private static ScheduleRequestResponse Map(DoctorScheduleRequest x, (int UserId, int? DepartmentId, bool IsAdmin) reviewer) => new()
    {
        RequestId = x.RequestId, DoctorId = x.DoctorId, DoctorName = x.Doctor.FullName,
        DepartmentId = x.Doctor.DepartmentId, DepartmentName = x.Doctor.Department.Name,
        RoomId = x.RoomId, RoomName = x.Room.Name, WorkDate = x.WorkDate,
        StartTime = x.StartTime, EndTime = x.EndTime, Status = x.Status,
        ReviewerId = x.ReviewerId, ReviewedAt = x.ReviewedAt, RejectReason = x.RejectReason,
        CreatedAt = x.CreatedAt, CanReview = x.Status == "Pending" &&
            (reviewer.IsAdmin || (x.Doctor.UserId != reviewer.UserId && x.Doctor.User?.Role.RoleName != RoleConstants.DepartmentHead))
    };
}

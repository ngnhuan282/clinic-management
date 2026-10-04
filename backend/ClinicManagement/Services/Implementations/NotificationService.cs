using ClinicManagement.DTOs.Responses;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Exceptions;
using ClinicManagement.Hubs;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class NotificationService(IHubContext<NotificationHub> hub, ApplicationDbContext db,
    ICurrentUserService currentUser, ILogger<NotificationService> logger) : INotificationService
{
    public Task SendToUserAsync(int userId, NotificationResponse notification, CancellationToken cancellationToken = default) =>
        hub.Clients.User(userId.ToString()).SendAsync("NotificationReceived", notification, cancellationToken);

    // Rows join the caller's SaveChanges/transaction; delivery happens only after commit.
    public async Task<List<Notification>> StageAsync(IEnumerable<int> userIds, string eventKey,
        string type, string title, string message)
    {
        var ids = userIds.Distinct().ToArray();
        var recipients = await db.Users.Where(x => ids.Contains(x.UserId) && x.Status)
            .Select(x => x.UserId).ToListAsync();
        var existing = await db.Notifications.Where(x => x.EventKey == eventKey && recipients.Contains(x.UserId))
            .Select(x => x.UserId).ToListAsync();
        var rows = recipients.Except(existing).Select(id => new Notification
        {
            UserId = id, EventKey = eventKey, Type = type, Title = title, Content = message
        }).ToList();
        db.Notifications.AddRange(rows);
        return rows;
    }

    public async Task PublishAsync(IEnumerable<Notification> notifications)
    {
        foreach (var row in notifications)
        {
            try { await SendToUserAsync(row.UserId, new NotificationResponse(row.Type, row.Content, row.CreatedAt)); }
            catch (Exception ex)
            {
                // A realtime outage must not turn a committed operation into a failed retry.
                logger.LogWarning(ex, "Realtime delivery failed for notification {NotificationId}", row.NotificationId);
            }
        }
    }

    public async Task<List<int>> ReviewRecipientsAsync(int doctorId)
    {
        var doctor = await db.Doctors.Include(x => x.User).ThenInclude(x => x!.Role)
            .SingleAsync(x => x.DoctorId == doctorId);
        var headRequest = doctor.User?.Role.RoleName == RoleConstants.DepartmentHead;
        return await db.Users.Where(x => x.Status && x.UserId != doctor.UserId
            && db.RolePermissions.Any(p => p.RoleId == x.RoleId && p.PermissionCode == PermissionCodes.SchedulesReview && p.Permission.IsImplemented)
            && (headRequest ? x.Role.RoleName == RoleConstants.Admin
                : x.Role.RoleName == RoleConstants.DepartmentHead && db.Doctors.Any(d =>
                    d.UserId == x.UserId && d.IsActive && d.DepartmentId == doctor.DepartmentId)))
            .Select(x => x.UserId).ToListAsync();
    }

    public Task<List<int>> ReceptionRecipientsAsync() => db.Users.Where(x => x.Status
        && x.Role.RoleName == RoleConstants.Receptionist
        && db.RolePermissions.Any(p => p.RoleId == x.RoleId && p.PermissionCode == PermissionCodes.AppointmentsCheckIn && p.Permission.IsImplemented))
        .Select(x => x.UserId).ToListAsync();

    public Task<List<int>> DoctorRecipientsAsync(int doctorId, string? requiredPermission = null) =>
        db.Doctors.Where(x => x.DoctorId == doctorId && x.IsActive && x.User != null && x.User.Status
            && (requiredPermission == null
                ? x.User.Role.RoleName == RoleConstants.Doctor || x.User.Role.RoleName == RoleConstants.DepartmentHead
                : db.RolePermissions.Any(p => p.RoleId == x.User.RoleId && p.PermissionCode == requiredPermission && p.Permission.IsImplemented)))
            .Select(x => x.UserId!.Value).ToListAsync();

    public async Task<PagedResponse<NotificationHistoryResponse>> ListAsync(int pageNumber, int pageSize)
    {
        var userId = currentUser.GetRequiredUserId();
        var query = db.Notifications.AsNoTracking().Where(x => x.UserId == userId);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.NotificationId)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(x => new NotificationHistoryResponse(x.NotificationId, x.Title, x.Content, x.Type, x.IsRead, x.CreatedAt))
            .ToListAsync();
        return new(items, pageNumber, pageSize, total);
    }

    public async Task MarkReadAsync(int id)
    {
        var userId = currentUser.GetRequiredUserId();
        var row = await db.Notifications.SingleOrDefaultAsync(x => x.NotificationId == id && x.UserId == userId)
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
        row.IsRead = true;
        await db.SaveChangesAsync();
    }
}

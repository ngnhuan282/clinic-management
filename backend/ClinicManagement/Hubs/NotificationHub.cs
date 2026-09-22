using ClinicManagement.Commons;
using ClinicManagement.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Hubs;

[Authorize]
public class NotificationHub(NotificationConnections connections, ApplicationDbContext db) : Hub
{
    public override async Task OnConnectedAsync()
    {
        if (!int.TryParse(Context.User?.FindFirst(ClaimConstants.UserId)?.Value, out var userId)
            || !int.TryParse(Context.User?.FindFirst(ClaimConstants.SecurityVersion)?.Value, out var version))
        {
            Context.Abort();
            return;
        }
        connections.Add(Context.ConnectionId, userId, Context.Abort);
        // Recheck after registration to close a race with account changes during negotiation.
        if (!await db.Users.AsNoTracking().AnyAsync(x => x.UserId == userId && x.Status && x.SecurityVersion == version))
        {
            connections.Remove(Context.ConnectionId);
            Context.Abort();
            return;
        }
        await base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        connections.Remove(Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }
}

public class NotificationUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection) =>
        connection.User?.FindFirst(ClaimConstants.UserId)?.Value;
}

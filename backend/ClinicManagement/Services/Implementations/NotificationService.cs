using ClinicManagement.DTOs.Responses;
using ClinicManagement.Hubs;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace ClinicManagement.Services.Implementations;

public class NotificationService(IHubContext<NotificationHub> hub) : INotificationService
{
    public Task SendToUserAsync(int userId, NotificationResponse notification, CancellationToken cancellationToken = default) =>
        hub.Clients.User(userId.ToString()).SendAsync("NotificationReceived", notification, cancellationToken);
}

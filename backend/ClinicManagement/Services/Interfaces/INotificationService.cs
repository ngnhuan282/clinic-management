using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface INotificationService
{
    Task SendToUserAsync(int userId, NotificationResponse notification, CancellationToken cancellationToken = default);
}

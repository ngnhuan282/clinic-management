namespace ClinicManagement.DTOs.Responses.Notifications;

public record NotificationResponse(string Type, string Message, DateTime CreatedAt);

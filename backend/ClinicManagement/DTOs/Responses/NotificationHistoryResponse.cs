namespace ClinicManagement.DTOs.Responses;

public record NotificationHistoryResponse(int NotificationId, string Title, string Message,
    string Type, bool IsRead, DateTime CreatedAt);

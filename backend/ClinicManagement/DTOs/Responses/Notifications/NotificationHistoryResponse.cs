namespace ClinicManagement.DTOs.Responses.Notifications;

public record NotificationHistoryResponse(int NotificationId, string Title, string Message,
    string Type, bool IsRead, DateTime CreatedAt, int? StockReviewId = null, int? LabTestId = null);

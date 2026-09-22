namespace ClinicManagement.DTOs.Responses;

public record NotificationResponse(string Type, string Message, DateTime CreatedAt);

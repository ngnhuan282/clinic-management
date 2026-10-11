namespace ClinicManagement.DTOs.Responses;

public record ReviewResponse(int ReviewId, int DoctorId, string DoctorName, int Rating,
    string? Comment, DateTime CreatedAt);

public record AdminReviewResponse(int ReviewId, int AppointmentId, int PatientId, int DoctorId,
    string DoctorName, int Rating, string? Comment, bool IsVisible, DateTime CreatedAt);

public record ReviewAppointmentResponse(int AppointmentId, int DoctorId, string DoctorName,
    DateTime AppointmentDate, int? ReviewId, int? Rating, string? Comment, bool? IsVisible);

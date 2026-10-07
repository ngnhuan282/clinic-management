namespace ClinicManagement.DTOs.Responses;

public record AppointmentChangedResponse(int AppointmentId, int DoctorId, DateTime AppointmentDate,
    TimeSpan StartTime, string Status, DateTime? CheckedInAt, DateTime? BookVerifiedAt,
    int? PatientProfileId, int? PatientBookId, string Change,
    int? PreviousDoctorId, DateTime? PreviousAppointmentDate);

public record SlotAvailabilityChangedResponse(int DoctorId, DateTime AppointmentDate);

public record BookInvoiceChangedResponse(int? BookInvoiceId, int? InvoiceId, int? PatientProfileId,
    string Status, DateTime? PaidAt);

public record PatientBookChangedResponse(int PatientBookId, int PatientProfileId,
    int? BookInvoiceId, string Status);

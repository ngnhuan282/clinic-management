using ClinicManagement.DTOs.Responses;
using ClinicManagement.Data.Entities;

namespace ClinicManagement.Services.Interfaces;

public interface INotificationService
{
    Task SendToUserAsync(int userId, NotificationResponse notification, CancellationToken cancellationToken = default);
    Task<List<Notification>> StageAsync(IEnumerable<int> userIds, string eventKey, string type, string title, string message);
    Task PublishAsync(IEnumerable<Notification> notifications);
    Task<List<int>> ReviewRecipientsAsync(int doctorId);
    Task<List<int>> ReceptionRecipientsAsync();
    Task<List<int>> DoctorRecipientsAsync(int doctorId, string? requiredPermission = null);
    Task PublishAppointmentChangedAsync(Appointment appointment, string change,
        int? previousDoctorId = null, DateTime? previousAppointmentDate = null);
    Task PublishBookInvoiceChangedAsync(BookInvoice invoice);
    Task PublishBookPaymentAsync(Invoice invoice);
    Task PublishPatientBookChangedAsync(PatientBook book);
    Task<PagedResponse<NotificationHistoryResponse>> ListAsync(int pageNumber, int pageSize);
    Task MarkReadAsync(int id);
}

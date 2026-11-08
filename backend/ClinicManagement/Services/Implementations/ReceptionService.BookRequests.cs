using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;

namespace ClinicManagement.Services.Implementations;

public partial class ReceptionService
{
    public async Task<PatientBookRequestResponse> CreateBookRequestAsync(int patientId, CreatePatientBookRequest request)
    {
        if (request.Reason is not ("New" or "Lost" or "Forgot"))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        await using var transaction = await _receptionRepository.BeginTransactionAsync();
        var patient = await _receptionRepository.GetPatientForUpdateAsync(patientId)
            ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND);
        var existing = await _receptionRepository.GetOpenBookRequestAsync(patientId);
        if (existing != null) return MapBookRequest(existing);

        var bookRequest = new PatientBookRequest
        {
            PatientId = patientId, Patient = patient, Reason = request.Reason,
            RequestedByUserId = _currentUser.GetRequiredUserId(), CreatedAt = DateTime.UtcNow
        };
        await _receptionRepository.AddBookRequestAsync(bookRequest);
        await _receptionRepository.SaveChangesAsync();
        var notifications = await _notifications.StageAsync(await _notifications.CashierRecipientsAsync(),
            $"book-request:{bookRequest.PatientBookRequestId}:created", "Billing", "Yêu cầu thanh toán sổ khám",
            $"Yêu cầu sổ #{bookRequest.PatientBookRequestId} đang chờ Thu ngân lập hóa đơn và thu tiền.");
        await _receptionRepository.SaveChangesAsync();
        await transaction.CommitAsync();
        await _notifications.PublishAsync(notifications);
        return MapBookRequest(bookRequest);
    }

    public async Task<PagedResponse<PatientBookRequestResponse>> GetBookRequestsAsync(PatientBookRequestQuery query)
    {
        var (items, total) = await _receptionRepository.GetBookRequestPageAsync(query);
        return new(items.Select(MapBookRequest), query.PageNumber, query.PageSize, total);
    }

    private static PatientBookRequestResponse MapBookRequest(PatientBookRequest request) => new()
    {
        PatientBookRequestId = request.PatientBookRequestId, PatientId = request.PatientId,
        PatientName = request.Patient.FullName, PatientPhone = request.Patient.Phone,
        Reason = request.Reason, RequestedByUserId = request.RequestedByUserId, CreatedAt = request.CreatedAt,
        BookInvoiceId = request.BookInvoiceId, Amount = request.BookInvoice?.Amount,
        Status = request.BookInvoice?.PatientBook?.Status == PatientBookStatusConstants.Issued
            ? "Issued" : request.BookInvoice?.Status ?? "Pending"
    };
}

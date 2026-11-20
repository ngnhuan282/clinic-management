using ClinicManagement.DTOs.Requests.Billing;
using ClinicManagement.DTOs.Requests.Shared;
using ClinicManagement.DTOs.Responses.Billing;
using ClinicManagement.DTOs.Responses.Shared;


namespace ClinicManagement.Services.Interfaces;

public interface IInvoiceService
{
    Task<List<PendingAppointmentBillingDto>> GetPendingBillingsAsync(string stage);
    Task<InvoiceResponseDto> CreateInvoiceAsync(int cashierId, CreateInvoiceDto dto);
    Task<InvoiceResponseDto> RecordPaymentAsync(int invoiceId, int cashierId, RecordInvoicePaymentDto dto);
    Task<InvoiceResponseDto?> GetInvoiceByIdAsync(int id);
    Task<IEnumerable<InvoiceResponseDto>> GetInvoiceHistoryAsync(string? searchKeyword);
    Task<InvoiceResponseDto> CreateAdjustmentInvoiceAsync(int cashierId, CreateAdjustmentInvoiceDto dto);
    Task<InvoiceAdjustmentPreview> PreviewAdjustmentAsync(CreateAdjustmentInvoiceDto dto);
    Task<PagedResponse<PatientInvoiceResponse>> GetPatientInvoicesAsync(int userId, PaginationRequest query);
}

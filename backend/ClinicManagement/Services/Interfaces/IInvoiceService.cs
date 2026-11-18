using ClinicManagement.DTOs.Invoices;

namespace ClinicManagement.Services.Interfaces;

public interface IInvoiceService
{
    Task<List<PendingAppointmentBillingDto>> GetPendingBillingsAsync(string stage);
    Task<InvoiceResponseDto> CreateInvoiceAsync(int cashierId, CreateInvoiceDto dto);
    Task<InvoiceResponseDto> RecordPaymentAsync(int invoiceId, int cashierId, RecordInvoicePaymentDto dto);
    Task<InvoiceResponseDto?> GetInvoiceByIdAsync(int id);
    Task<IEnumerable<InvoiceResponseDto>> GetInvoiceHistoryAsync(string? searchKeyword);
    Task<InvoiceResponseDto> CreateAdjustmentInvoiceAsync(int cashierId, CreateAdjustmentInvoiceDto dto);
}
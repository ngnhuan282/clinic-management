using System.Collections.Generic;
using System.Threading.Tasks;
using ClinicManagement.DTOs.Invoices;

namespace ClinicManagement.Services.Interfaces
{
    public interface IInvoiceService
    {
        Task<List<PendingAppointmentBillingDto>> GetPendingBillingsAsync(string stage);
        Task<InvoiceResponseDto> CreateInvoiceAsync(int cashierId, CreateInvoiceDto dto);
        Task<InvoiceResponseDto?> GetInvoiceByIdAsync(int id);
    }
}
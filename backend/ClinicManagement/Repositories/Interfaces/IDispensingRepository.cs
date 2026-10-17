using System.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using Microsoft.EntityFrameworkCore.Storage;

namespace ClinicManagement.Repositories.Interfaces;

public interface IDispensingRepository
{
    Task<(IEnumerable<Prescription> Items, int TotalItems)> GetPagedAsync(
        DispensingFilterRequest request, DateOnly today
    );

    Task<(int AwaitingPayment, int ReadyToDispense, int DispensedToday, int NeedsReview)>
        GetSummaryAsync(DateTime todayStart, DateTime tomorrowStart);

    Task<Prescription?> GetByIdAsync(
        int prescriptionId,
        bool asNoTracking = true
    );

    Task<IReadOnlyList<Invoice>> GetPaidMedicineInvoicesAsync(
        IReadOnlyCollection<int> appointmentIds, bool onlyPaid = true
    );

    Task<Invoice?> GetPaidMedicineInvoiceAsync(
        int appointmentId,
        int prescriptionId,
        IReadOnlyCollection<int> prescriptionDetailIds, bool onlyPaid = true
    );

    Task AddDispenseDetailsAsync(
        IEnumerable<DispenseDetail> dispenseDetails
    );

    Task SaveChangesAsync();

    Task AddStockReviewAsync(PrescriptionStockReview review);
    Task<IReadOnlyList<StockReviewRecipientResponse>> GetReviewRecipientsAsync(int doctorId, int? cashierId);

    Task<IDbContextTransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel
    );
}

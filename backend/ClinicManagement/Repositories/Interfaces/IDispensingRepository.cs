using System.Data;
using ClinicManagement.DTOs.Requests.Dispensing;
using ClinicManagement.DTOs.Responses.StockReviews;
using ClinicManagement.Data.Entities;
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
        IReadOnlyCollection<int> appointmentIds
    );

    Task<IReadOnlyDictionary<int, Invoice>> GetReconciledMedicineInvoicesAsync(IReadOnlyCollection<int> prescriptionIds);

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

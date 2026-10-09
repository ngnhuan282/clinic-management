using System.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using Microsoft.EntityFrameworkCore.Storage;

namespace ClinicManagement.Repositories.Interfaces;

public interface IDispensingRepository
{
    Task<(IEnumerable<Prescription> Items, int TotalItems)> GetPagedAsync(
        DispensingFilterRequest request
    );

    Task<(int AwaitingPayment, int ReadyToDispense, int DispensedToday)>
        GetSummaryAsync(DateTime todayStart, DateTime tomorrowStart);

    Task<Prescription?> GetByIdAsync(
        int prescriptionId,
        bool asNoTracking = true
    );

    Task<IReadOnlyList<Invoice>> GetPaidMedicineInvoicesAsync(
        IReadOnlyCollection<int> appointmentIds
    );

    Task<Invoice?> GetPaidMedicineInvoiceAsync(
        int appointmentId,
        int prescriptionId,
        IReadOnlyCollection<int> prescriptionDetailIds
    );

    Task AddDispenseDetailsAsync(
        IEnumerable<DispenseDetail> dispenseDetails
    );

    Task SaveChangesAsync();

    Task<IDbContextTransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel
    );
}

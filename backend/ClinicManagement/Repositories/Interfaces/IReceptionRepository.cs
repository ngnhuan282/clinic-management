using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore.Storage;

namespace ClinicManagement.Repositories.Interfaces;

public interface IReceptionRepository
{
    Task<List<Patient>> FindPatientsAsync(string search);
    Task<Patient?> GetPatientAsync(int patientId);
    Task<bool> HasMatchingPatientAsync(string fullName, string phone, string? identityNumber);
    Task AddPatientAsync(Patient patient);
    Task<List<PatientBook>> GetBooksAsync(int patientId);
    Task<PatientBook?> GetBookAsync(int patientBookId);
    Task AddBookAsync(PatientBook book);
    Task<List<BookInvoice>> GetBookInvoicesAsync(int patientId);
    Task<BookInvoice?> GetBookInvoiceAsync(int invoiceId);
    Task AddBookInvoiceAsync(BookInvoice invoice);
    Task<IDbContextTransaction> BeginTransactionAsync();
    Task SaveChangesAsync();
}

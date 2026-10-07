using System.Data;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace ClinicManagement.Repositories.Implementations;

public class ReceptionRepository : IReceptionRepository
{
    private readonly ApplicationDbContext _context;

    public ReceptionRepository(ApplicationDbContext context) => _context = context;

    public Task<List<Patient>> FindPatientsAsync(string search) => _context.Patients.AsNoTracking()
        .Where(x => x.Phone.Contains(search) || x.FullName.Contains(search) ||
            (x.IdentityNumber != null && x.IdentityNumber.Contains(search)))
        .OrderBy(x => x.PatientId).Take(10).ToListAsync();

    public Task<Patient?> GetPatientAsync(int patientId) =>
        _context.Patients.SingleOrDefaultAsync(x => x.PatientId == patientId);

    public Task<bool> HasMatchingPatientAsync(string fullName, string phone, string? identityNumber) =>
        _context.Patients.AnyAsync(x =>
            (x.FullName == fullName && x.Phone == phone) ||
            (identityNumber != null && x.IdentityNumber == identityNumber));

    public Task AddPatientAsync(Patient patient) => _context.Patients.AddAsync(patient).AsTask();

    public Task<List<PatientBook>> GetBooksAsync(int patientId) => _context.PatientBooks.AsNoTracking()
        .Where(x => x.PatientId == patientId).OrderByDescending(x => x.IssuedAt)
        .ThenByDescending(x => x.PatientBookId).ToListAsync();

    public Task<PatientBook?> GetBookAsync(int patientBookId) =>
        _context.PatientBooks.Include(x => x.BookInvoice)
            .SingleOrDefaultAsync(x => x.PatientBookId == patientBookId);

    public Task AddBookAsync(PatientBook book) => _context.PatientBooks.AddAsync(book).AsTask();

    public Task<bool> IsBookInUseAsync(int patientBookId) => _context.Appointments.AnyAsync(x =>
        x.PatientBookId == patientBookId && x.CheckedInAt != null
        && x.Status != AppointmentStatusConstants.Completed && x.Status != AppointmentStatusConstants.Cancelled);

    public Task<List<BookInvoice>> GetBookInvoicesAsync(int patientId) => _context.BookInvoices.AsNoTracking()
        .Where(x => x.PatientId == patientId).OrderByDescending(x => x.CreatedAt)
        .ThenByDescending(x => x.BookInvoiceId).ToListAsync();

    public Task<BookInvoice?> GetBookInvoiceAsync(int invoiceId) =>
        _context.BookInvoices.Include(x => x.PatientBook)
            .SingleOrDefaultAsync(x => x.BookInvoiceId == invoiceId);

    public Task AddBookInvoiceAsync(BookInvoice invoice) => _context.BookInvoices.AddAsync(invoice).AsTask();

    public Task<IDbContextTransaction> BeginTransactionAsync() =>
        _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

    public Task SaveChangesAsync() => _context.SaveChangesAsync();
}

using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class ReceptionService : IReceptionService
{
    private static DateTime ClinicToday => TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
        DateTime.UtcNow, "Asia/Ho_Chi_Minh").Date;

    private readonly IReceptionRepository _receptionRepository;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly ILogger<ReceptionService> _logger;
    private readonly INotificationService _notifications;
    private readonly IPatientRepository _patientRepository;

    public ReceptionService(IReceptionRepository receptionRepository,
        IAppointmentRepository appointmentRepository, ILogger<ReceptionService> logger,
        INotificationService notifications, IPatientRepository patientRepository)
    {
        _receptionRepository = receptionRepository;
        _appointmentRepository = appointmentRepository;
        _logger = logger;
        _notifications = notifications;
        _patientRepository = patientRepository;
    }

    public async Task<List<PatientMatchResponse>> FindPatientsAsync(string search)
    {
        if (string.IsNullOrWhiteSpace(search) || search.Trim().Length < 2)
            throw new AppException(ErrorCode.INVALID_REQUEST);

        return (await _receptionRepository.FindPatientsAsync(search.Trim()))
            .Select(MapPatient).ToList();
    }

    public async Task<AppointmentResponse> MatchAppointmentPatientAsync(int appointmentId, int? patientProfileId)
    {
        await using var transaction = await _receptionRepository.BeginTransactionAsync();
        var appointment = await RequireReceptionAppointmentAsync(appointmentId);
        if (appointment.Status is AppointmentStatusConstants.Cancelled or AppointmentStatusConstants.Completed
            or AppointmentStatusConstants.InProgress || appointment.CheckedInAt.HasValue)
            throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);

        Patient patient;
        if (patientProfileId.HasValue)
        {
            patient = await _receptionRepository.GetPatientAsync(patientProfileId.Value)
                ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND);
            if (!SameIdentity(appointment.PatientName, appointment.PatientPhone, patient))
                throw new AppException(ErrorCode.PATIENT_IDENTITY_MISMATCH);
        }
        else
        {
            if (await _receptionRepository.HasMatchingPatientAsync(
                    appointment.PatientName, appointment.PatientPhone, null))
                throw new AppException(ErrorCode.PATIENT_MATCH_REQUIRED);

            patient = new Patient
            {
                FullName = appointment.PatientName,
                Phone = appointment.PatientPhone,
                CreatedAt = DateTime.UtcNow
            };
            await _receptionRepository.AddPatientAsync(patient);
            await _receptionRepository.SaveChangesAsync();
        }

        // Online bookings carry the patient's account; link it so the patient can see this profile in their portal.
        if (appointment.PatientId.HasValue && patient.UserId == null
            && !await _patientRepository.HasProfileForUserAsync(appointment.PatientId.Value))
        {
            patient.UserId = appointment.PatientId;
        }

        appointment.PatientProfileId = patient.PatientId;
        await _appointmentRepository.SaveChangesAsync();
        await transaction.CommitAsync();
        await _notifications.PublishAppointmentChangedAsync(appointment, "PatientMatched");
        _logger.LogInformation("Patient profile matched for appointment {AppointmentId}", appointmentId);
        return MapAppointment(appointment);
    }

    public async Task<List<PatientBookResponse>> GetBooksAsync(int patientId)
    {
        await RequirePatientAsync(patientId);
        return (await _receptionRepository.GetBooksAsync(patientId)).Select(MapBook).ToList();
    }

    public async Task<PatientBookResponse> RegisterExistingBookAsync(int patientId,
        RegisterExistingBookRequest request)
    {
        if (!request.BookPresented || string.IsNullOrWhiteSpace(request.BookNumber))
            throw new AppException(ErrorCode.BOOK_NOT_VERIFIED);
        await RequirePatientAsync(patientId);
        var book = new PatientBook
        {
            PatientId = patientId,
            BookNumber = request.BookNumber.Trim(),
            Status = "Issued",
            IssuedAt = DateTime.UtcNow
        };
        await _receptionRepository.AddBookAsync(book);
        await SaveBookAsync();
        await _notifications.PublishPatientBookChangedAsync(book);
        _logger.LogInformation("Existing patient book registered for patient {PatientId}", patientId);
        return MapBook(book);
    }

    public async Task<List<BookInvoiceResponse>> GetBookInvoicesAsync(int patientId)
    {
        await RequirePatientAsync(patientId);
        return (await _receptionRepository.GetBookInvoicesAsync(patientId)).Select(MapInvoice).ToList();
    }

    public async Task<BookInvoiceResponse> CreateBookInvoiceAsync(int patientId,
        CreateBookInvoiceRequest request)
    {
        if (request.Amount <= 0) throw new AppException(ErrorCode.INVALID_REQUEST);
        await RequirePatientAsync(patientId);
        var invoice = new BookInvoice
        {
            PatientId = patientId,
            Amount = request.Amount,
            Status = "Unpaid",
            CreatedAt = DateTime.UtcNow
        };
        await _receptionRepository.AddBookInvoiceAsync(invoice);
        await _receptionRepository.SaveChangesAsync();
        _logger.LogInformation("Book invoice {InvoiceId} created for patient {PatientId}",
            invoice.BookInvoiceId, patientId);
        await _notifications.PublishBookInvoiceChangedAsync(invoice);
        return MapInvoice(invoice);
    }

    public async Task<BookInvoiceResponse> MarkBookInvoicePaidAsync(int invoiceId)
    {
        await using var transaction = await _receptionRepository.BeginTransactionAsync();
        var invoice = await _receptionRepository.GetBookInvoiceAsync(invoiceId)
            ?? throw new AppException(ErrorCode.BOOK_INVOICE_NOT_FOUND);
        if (invoice.Status != "Unpaid") throw new AppException(ErrorCode.BOOK_INVOICE_INVALID_STATUS);
        invoice.Status = "Paid";
        invoice.PaidAt = DateTime.UtcNow;
        // A paid book waits as Pending until reception issues its real number.
        await _receptionRepository.AddBookAsync(new PatientBook
        {
            PatientId = invoice.PatientId,
            BookInvoiceId = invoiceId,
            BookNumber = PendingBookNumber(invoiceId),
            Status = PatientBookStatusConstants.Pending,
            IssuedAt = invoice.PaidAt.Value,
            CreatedAt = invoice.PaidAt.Value,
            UpdatedAt = invoice.PaidAt.Value
        });
        var rows = await _notifications.StageAsync(await _notifications.ReceptionRecipientsAsync(),
            $"book-invoice:{invoiceId}:paid", "Billing", "Tiền sổ đã thanh toán",
            $"Hóa đơn sổ #{invoiceId} đã thanh toán. Lễ tân có thể xử lý cấp sổ.");
        await _receptionRepository.SaveChangesAsync();
        await transaction.CommitAsync();
        await _notifications.PublishAsync(rows);
        await _notifications.PublishBookInvoiceChangedAsync(invoice);
        _logger.LogInformation("Book invoice {InvoiceId} marked paid", invoiceId);
        return MapInvoice(invoice);
    }

    public async Task<PatientBookResponse> IssueBookAsync(int invoiceId, string bookNumber)
    {
        if (string.IsNullOrWhiteSpace(bookNumber) || bookNumber.Trim().Length > 40)
            throw new AppException(ErrorCode.INVALID_REQUEST);
        await using var transaction = await _receptionRepository.BeginTransactionAsync();
        var invoice = await _receptionRepository.GetBookInvoiceAsync(invoiceId)
            ?? throw new AppException(ErrorCode.BOOK_INVOICE_NOT_FOUND);
        if (invoice.Status != "Paid"
            || invoice.PatientBook is { Status: not PatientBookStatusConstants.Pending })
            throw new AppException(ErrorCode.BOOK_INVOICE_INVALID_STATUS);
        var now = DateTime.UtcNow;
        var book = invoice.PatientBook ?? new PatientBook
        {
            PatientId = invoice.PatientId,
            PreviousBookId = previousBook?.PatientBookId,
            BookInvoiceId = invoiceId,
            CreatedAt = now
        };
        book.BookNumber = bookNumber.Trim();
        book.Status = PatientBookStatusConstants.Issued;
        book.IssuedAt = now;
        book.UpdatedAt = now;
        if (invoice.PatientBook == null) await _receptionRepository.AddBookAsync(book);
        await SaveBookAsync();
        await transaction.CommitAsync();
        if (previousBook != null) await _notifications.PublishPatientBookChangedAsync(previousBook);
        await _notifications.PublishPatientBookChangedAsync(book);
        _logger.LogInformation("Book {PatientBookId} issued after invoice {InvoiceId} was paid",
            book.PatientBookId, invoiceId);
        return MapBook(book);
    }

    public async Task<AppointmentResponse> CheckInAsync(int appointmentId, CheckInAppointmentRequest request)
    {
        await using var transaction = await _receptionRepository.BeginTransactionAsync();
        var appointment = await RequireReceptionAppointmentAsync(appointmentId);
        if (appointment.Status != AppointmentStatusConstants.Confirmed ||
            appointment.AppointmentDate.Date != ClinicToday || appointment.CheckedInAt.HasValue)
            throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);
        if (appointment.PatientProfileId != request.PatientProfileId)
            throw new AppException(ErrorCode.PATIENT_IDENTITY_MISMATCH);

        var book = await _receptionRepository.GetBookAsync(request.PatientBookId)
            ?? throw new AppException(ErrorCode.BOOK_NOT_FOUND);
        if (book.PatientId != request.PatientProfileId || book.Status != "Issued" ||
            (book.BookInvoiceId.HasValue && book.BookInvoice?.Status != "Paid") ||
            (!book.BookInvoiceId.HasValue && !request.BookPresented))
            throw new AppException(ErrorCode.BOOK_NOT_VERIFIED);

        var now = DateTime.UtcNow;
        appointment.PatientBookId = book.PatientBookId;
        appointment.BookVerifiedAt = now;
        appointment.CheckedInAt = now;
        var recipients = await _notifications.DoctorRecipientsAsync(appointment.DoctorId, PermissionCodes.ClinicalViewAssigned);
        var rows = await _notifications.StageAsync(recipients,
            $"appointment:{appointmentId}:checked-in", "Appointment", "Lượt khám đã check-in",
            $"Lượt khám #{appointmentId} đã check-in và sẵn sàng vào khám.");
        await _appointmentRepository.SaveChangesAsync();
        await transaction.CommitAsync();
        await _notifications.PublishAsync(rows);
        await _notifications.PublishAppointmentChangedAsync(appointment, "CheckedIn");
        _logger.LogInformation("Appointment {AppointmentId} checked in with book {PatientBookId}",
            appointmentId, book.PatientBookId);
        return MapAppointment(appointment);
    }

    private async Task<Appointment> RequireReceptionAppointmentAsync(int appointmentId) =>
        await _appointmentRepository.GetByIdAsync(appointmentId)
            ?? throw new AppException(ErrorCode.APPOINTMENT_NOT_FOUND);

    private async Task<Patient> RequirePatientAsync(int patientId) =>
        await _receptionRepository.GetPatientAsync(patientId)
            ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND);

    private async Task SaveBookAsync()
    {
        try { await _receptionRepository.SaveChangesAsync(); }
        catch (DbUpdateException exception) when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new AppException(ErrorCode.BOOK_CONFLICT);
        }
    }

    private static bool SameIdentity(string name, string phone, Patient patient) =>
        string.Equals(name.Trim(), patient.FullName.Trim(), StringComparison.OrdinalIgnoreCase) &&
        string.Equals(phone.Trim(), patient.Phone.Trim(), StringComparison.Ordinal);

    private static PatientMatchResponse MapPatient(Patient patient) => new()
    {
        PatientId = patient.PatientId, FullName = patient.FullName, Phone = patient.Phone,
        BirthDate = patient.BirthDate, IdentityNumber = patient.IdentityNumber,
        InsuranceCode = patient.InsuranceCode
    };

    private static PatientBookResponse MapBook(PatientBook book) => new()
    {
        PatientBookId = book.PatientBookId, PatientId = book.PatientId,
        BookInvoiceId = book.BookInvoiceId, PreviousBookId = book.PreviousBookId,
        BookNumber = book.BookNumber, Status = book.Status, IssuedAt = book.IssuedAt
    };

    // Placeholder for a paid book whose number has not been issued yet; unique per invoice.
    private static string PendingBookNumber(int invoiceId) => $"PENDING-{invoiceId}";

    private static BookInvoiceResponse MapInvoice(BookInvoice invoice) => new()
    {
        BookInvoiceId = invoice.BookInvoiceId, PatientId = invoice.PatientId,
        Amount = invoice.Amount, Status = invoice.Status, PaidAt = invoice.PaidAt
    };

    private static AppointmentResponse MapAppointment(Appointment appointment) => new()
    {
        AppointmentId = appointment.AppointmentId, DoctorId = appointment.DoctorId,
        DoctorName = appointment.Doctor.FullName, DepartmentName = appointment.Doctor.Department.Name,
        PatientName = appointment.PatientName, PatientPhone = appointment.PatientPhone,
        AppointmentDate = appointment.AppointmentDate, StartTime = appointment.StartTime,
        EndTime = appointment.EndTime, Reason = appointment.Reason, Status = appointment.Status,
        PatientProfileId = appointment.PatientProfileId, PatientBookId = appointment.PatientBookId,
        BookVerifiedAt = appointment.BookVerifiedAt, CheckedInAt = appointment.CheckedInAt
    };
}

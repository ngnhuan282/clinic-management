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

public class PatientBookService : IPatientBookService
{
    private static readonly string[] KnownStatuses =
    [
        PatientBookStatusConstants.Pending,
        PatientBookStatusConstants.Issued,
        PatientBookStatusConstants.Lost,
        PatientBookStatusConstants.Replaced
    ];

    private readonly IReceptionRepository _receptionRepository;
    private readonly ILogger<PatientBookService> _logger;
    private readonly ICurrentUserService _currentUser;

    public PatientBookService(IReceptionRepository receptionRepository, ILogger<PatientBookService> logger,
        ICurrentUserService currentUser)
    {
        _receptionRepository = receptionRepository;
        _logger = logger;
        _currentUser = currentUser;
    }

    public async Task<PagedResponse<PatientBookListItemResponse>> GetBookPageAsync(PatientBookQuery query)
    {
        if (!string.IsNullOrWhiteSpace(query.Status) && !KnownStatuses.Contains(query.Status.Trim()))
            throw new AppException(ErrorCode.INVALID_REQUEST);

        var (items, total) = await _receptionRepository.GetBookPageAsync(query);
        return new PagedResponse<PatientBookListItemResponse>(
            items.Select(MapListItem), query.PageNumber, query.PageSize, total);
    }

    public async Task<PatientBookResponse> UpdateStatusAsync(int patientBookId, UpdatePatientBookStatusRequest request)
    {
        var target = request.Status.Trim();
        if (!KnownStatuses.Contains(target)) throw new AppException(ErrorCode.INVALID_REQUEST);

        await using var transaction = await _receptionRepository.BeginTransactionAsync();
        var book = await _receptionRepository.GetBookAsync(patientBookId)
            ?? throw new AppException(ErrorCode.PATIENT_BOOK_NOT_FOUND);
        var now = DateTime.UtcNow;

        PatientBook result;
        if (book.Status == PatientBookStatusConstants.Pending && target == PatientBookStatusConstants.Issued)
        {
            book.BookNumber = RequireNewBookNumber(request.NewBookNumber);
            book.Status = PatientBookStatusConstants.Issued;
            book.IssuedAt = now;
            book.UpdatedAt = now;
            book.IssuedByUserId = _currentUser.GetRequiredUserId();
            await SaveAsync();
            result = book;
        }
        else if (book.Status == PatientBookStatusConstants.Issued
            && (target == PatientBookStatusConstants.Lost || target == PatientBookStatusConstants.Replaced))
        {
            if (await _receptionRepository.IsBookInUseAsync(book.PatientBookId))
                throw new AppException(ErrorCode.BOOK_IN_USE);

            var newBookNumber = RequireNewBookNumber(request.NewBookNumber);
            // Reissuing a book is treated the same as the first issuance: it must be backed by a paid
            // invoice whose placeholder book (created by MarkBookInvoicePaidAsync) is still Pending, so
            // staff cannot hand out a replacement for free.
            var invoice = await _receptionRepository.GetBookInvoiceAsync(
                request.BookInvoiceId ?? throw new AppException(ErrorCode.INVALID_REQUEST))
                ?? throw new AppException(ErrorCode.BOOK_INVOICE_NOT_FOUND);
            if (invoice.PatientId != book.PatientId || invoice.Status != "Paid"
                || invoice.PatientBook is { Status: not PatientBookStatusConstants.Pending })
                throw new AppException(ErrorCode.BOOK_INVOICE_INVALID_STATUS);

            book.Status = target;
            book.UpdatedAt = now;
            // Retire the old book before inserting the replacement: only one Issued book per patient is allowed.
            await SaveAsync();

            // Reuse the invoice's own placeholder book row when present (BookInvoiceId is unique per book);
            // only a brand-new invoice with no placeholder yet needs a brand-new row.
            result = invoice.PatientBook ?? new PatientBook
            {
                PatientId = book.PatientId,
                BookInvoiceId = invoice.BookInvoiceId,
                CreatedAt = now
            };
            result.PreviousBookId = book.PatientBookId;
            result.BookNumber = newBookNumber;
            result.Status = PatientBookStatusConstants.Issued;
            result.IssuedAt = now;
            result.UpdatedAt = now;
            result.IssuedByUserId = _currentUser.GetRequiredUserId();
            if (invoice.PatientBook == null) await _receptionRepository.AddBookAsync(result);
            await SaveAsync();
        }
        else
        {
            throw new AppException(ErrorCode.PATIENT_BOOK_INVALID_STATUS);
        }

        await transaction.CommitAsync();
        _logger.LogInformation("Patient book {PatientBookId} changed to {Status}; active book {ActiveBookId}",
            patientBookId, target, result.PatientBookId);
        return MapBook(result);
    }

    public async Task<List<PatientBookResponse>> GetHistoryAsync(int patientBookId)
    {
        var book = await _receptionRepository.GetBookAsync(patientBookId)
            ?? throw new AppException(ErrorCode.PATIENT_BOOK_NOT_FOUND);
        var books = await _receptionRepository.GetBooksAsync(book.PatientId);
        var byId = books.ToDictionary(x => x.PatientBookId);
        var childrenByPrevious = books
            .Where(x => x.PreviousBookId.HasValue)
            .ToLookup(x => x.PreviousBookId!.Value);

        // Walk back to the first book of the chain, then forward along replacements. The counters stop on bad links.
        var rootId = book.PatientBookId;
        for (var step = 0; step < books.Count && byId.TryGetValue(rootId, out var current)
            && current.PreviousBookId.HasValue; step++)
        {
            rootId = current.PreviousBookId!.Value;
        }

        var chain = new List<PatientBookResponse>();
        var currentId = (int?)rootId;
        while (currentId.HasValue && byId.TryGetValue(currentId.Value, out var item) && chain.Count < books.Count)
        {
            chain.Add(MapBook(item));
            currentId = childrenByPrevious[item.PatientBookId]
                .OrderBy(x => x.IssuedAt)
                .Select(x => (int?)x.PatientBookId)
                .FirstOrDefault();
        }

        return chain;
    }

    private static string RequireNewBookNumber(string? bookNumber)
    {
        if (string.IsNullOrWhiteSpace(bookNumber)) throw new AppException(ErrorCode.INVALID_REQUEST);
        return bookNumber.Trim();
    }

    private async Task SaveAsync()
    {
        try { await _receptionRepository.SaveChangesAsync(); }
        catch (DbUpdateException exception) when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new AppException(ErrorCode.BOOK_CONFLICT);
        }
    }

    private static PatientBookListItemResponse MapListItem(PatientBook book) => new()
    {
        PatientBookId = book.PatientBookId,
        PatientId = book.PatientId,
        PatientName = book.Patient.FullName,
        PatientPhone = book.Patient.Phone,
        BookInvoiceId = book.BookInvoiceId,
        PreviousBookId = book.PreviousBookId,
        BookNumber = book.BookNumber,
        Status = book.Status,
        IssuedAt = book.IssuedAt,
        IssuedByUserId = book.IssuedByUserId
    };

    private static PatientBookResponse MapBook(PatientBook book) => new()
    {
        PatientBookId = book.PatientBookId,
        PatientId = book.PatientId,
        BookInvoiceId = book.BookInvoiceId,
        PreviousBookId = book.PreviousBookId,
        BookNumber = book.BookNumber,
        Status = book.Status,
        IssuedAt = book.IssuedAt,
        IssuedByUserId = book.IssuedByUserId
    };
}

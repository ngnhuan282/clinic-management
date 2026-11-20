using ClinicManagement.DTOs.Requests.Shared;
using ClinicManagement.DTOs.Responses.Billing;
using ClinicManagement.DTOs.Responses.Shared;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public partial class InvoiceService
{
    private sealed record PatientInvoiceKey(string Source, int Id, DateTime CreatedAt);

    public async Task<PagedResponse<PatientInvoiceResponse>> GetPatientInvoicesAsync(int userId, PaginationRequest query)
    {
        var profiles = context.Patients.Where(p => p.UserId == userId).Select(p => p.PatientId);
        var appointments = context.Appointments.Where(a => a.PatientId == userId || a.PatientId == null
            && a.PatientProfileId.HasValue && profiles.Contains(a.PatientProfileId.Value)).Select(a => a.AppointmentId);
        var ownLabs = context.LabTests.Where(t => t.PatientProfileId.HasValue
            ? profiles.Contains(t.PatientProfileId.Value) : t.PatientId == userId).Select(t => t.Id);
        var ownStandard = context.Invoices.AsNoTracking().Where(i => i.InvoiceType == "Standard" &&
            (i.BillingStage == "Book"
                ? profiles.Contains(i.PatientId)
                : i.AppointmentId > 0
                    ? appointments.Contains(i.AppointmentId!.Value)
                    : i.BillingStage == "LabAndConsultation" && i.InvoiceDetails.Any(d => d.SourceType == "LabTest")
                        && i.InvoiceDetails.All(d => d.SourceType == "LabTest" && ownLabs.Contains(d.SourceId))));
        var ownedIds = ownStandard.Select(i => i.Id);
        var cashier = context.Invoices.AsNoTracking().Where(i => ownedIds.Contains(i.Id)
            || i.InvoiceType == "Adjustment" && i.OriginalInvoiceId.HasValue && ownedIds.Contains(i.OriginalInvoiceId.Value));
        var legacyBooks = context.BookInvoices.AsNoTracking().Where(b => profiles.Contains(b.PatientId)
            && !ownStandard.Any(i => i.BillingStage == "Book" && i.InvoiceDetails.Any(d =>
                d.SourceType == "Book" && d.SourceId == b.BookInvoiceId || d.SourceType == "BookRequest"
                && context.PatientBookRequests.Any(r => r.PatientBookRequestId == d.SourceId && r.BookInvoiceId == b.BookInvoiceId))));

        var keys = cashier.Select(i => new { Source = "Invoice", i.Id, i.CreatedAt })
            .Concat(legacyBooks.Select(b => new { Source = "BookInvoice", Id = b.BookInvoiceId, b.CreatedAt }));
        var count = await keys.CountAsync();
        var offset = (query.PageNumber - 1L) * query.PageSize;
        if (offset >= count)
            return new PagedResponse<PatientInvoiceResponse>([], query.PageNumber, query.PageSize, count);

        var page = await keys.OrderByDescending(k => k.CreatedAt).ThenBy(k => k.Source).ThenByDescending(k => k.Id)
            .Skip((int)offset).Take(query.PageSize).Select(k => new PatientInvoiceKey(k.Source, k.Id, k.CreatedAt)).ToListAsync();
        var invoiceIds = page.Where(p => p.Source == "Invoice").Select(p => p.Id).ToArray();
        var bookIds = page.Where(p => p.Source == "BookInvoice").Select(p => p.Id).ToArray();
        var invoices = await cashier.Where(i => invoiceIds.Contains(i.Id))
            .Include(i => i.InvoiceDetails).Include(i => i.Payments).AsSplitQuery().ToDictionaryAsync(i => i.Id);
        var books = await legacyBooks.Where(b => bookIds.Contains(b.BookInvoiceId)).ToDictionaryAsync(b => b.BookInvoiceId);
        var adjustments = await ReadAdjustmentTotalsAsync(invoiceIds);
        var items = new List<PatientInvoiceResponse>();
        foreach (var key in page)
        {
            if (key.Source == "Invoice" && invoices.TryGetValue(key.Id, out var invoice))
                items.Add(ToPatientInvoice(invoice, GetBalance(invoice, adjustments.GetValueOrDefault(invoice.Id))));
            else if (key.Source == "BookInvoice" && books.TryGetValue(key.Id, out var book))
                items.Add(ToPatientBookInvoice(book));
        }
        return new PagedResponse<PatientInvoiceResponse>(items, query.PageNumber, query.PageSize, count);
    }

    private static DateTime AsUtc(DateTime date) => DateTime.SpecifyKind(date, DateTimeKind.Utc);

    private static PatientInvoiceResponse ToPatientInvoice(Invoice invoice, InvoiceBalance balance) => new(
        "Invoice", invoice.Id, invoice.OriginalInvoiceId, invoice.AppointmentId, invoice.BillingStage,
        invoice.Status, AsUtc(invoice.CreatedAt), balance.Total, balance.Insurance, balance.Patient, balance.NetPaid,
        invoice.InvoiceType == "Standard" ? balance.Remaining : 0,
        invoice.InvoiceDetails.Where(d => d.SourceType != "AdjustmentReason").OrderBy(d => d.Id)
            .Select(d => new PatientInvoiceLine(d.ItemName, d.Quantity, d.UnitPrice, d.TotalPrice)).ToList(),
        invoice.Payments.OrderBy(p => p.PaidAt).ThenBy(p => p.Id)
            .Select(p => new PatientInvoicePayment(p.ReceiptNumber, p.PaymentType, p.PaymentMethod, p.Amount, AsUtc(p.PaidAt))).ToList());

    private static PatientInvoiceResponse ToPatientBookInvoice(BookInvoice book) => new(
        "BookInvoice", book.BookInvoiceId, null, null, "Book", book.Status, AsUtc(book.CreatedAt),
        book.Amount, 0, book.Amount, book.Status == "Paid" ? book.Amount : 0,
        book.Status == "Paid" ? 0 : book.Amount, [new PatientInvoiceLine("Phí cấp sổ khám", 1, book.Amount, book.Amount)],
        book.PaidAt is DateTime paidAt ? [new PatientInvoicePayment(null, "Payment", null, book.Amount, AsUtc(paidAt))] : []);
}

using System.Data;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace ClinicManagement.Repositories.Implementations;

public class DispensingRepository(ApplicationDbContext context) : IDispensingRepository
{
    public async Task<(IEnumerable<Prescription> Items, int TotalItems)> GetPagedAsync(
        DispensingFilterRequest request, DateOnly today)
    {
        var query = WorkflowQuery(ActiveQuery(), request.WorkflowStatus, today);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            var codePart = search.Split('-', StringSplitOptions.RemoveEmptyEntries).LastOrDefault();
            var prescriptionId = int.TryParse(codePart, out var id) ? id : -1;
            query = query.Where(x => x.PrescriptionId == prescriptionId
                || x.MedicalRecord.Appointment.PatientName.Contains(search)
                || x.MedicalRecord.Appointment.PatientPhone.Contains(search));
        }
        if (request.FromDate.HasValue)
        {
            var from = request.FromDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.PrescriptionDate >= from);
        }
        if (request.ToDate.HasValue)
        {
            var to = request.ToDate.Value.ToDateTime(TimeOnly.MaxValue);
            query = query.Where(x => x.PrescriptionDate <= to);
        }
        if (request.PaymentStatus != null)
        {
            var paid = PaidQuery(query);
            var paidIds = paid.Select(x => x.PrescriptionId);
            query = request.PaymentStatus == "Paid" ? paid : query.Where(x => !paidIds.Contains(x.PrescriptionId));
        }
        query = request.ReviewStatus switch
        {
            "Pending" => query.Where(x => x.StockReviews.Any(r => r.Status == "Pending")),
            "NotRequested" => query.Where(x => !x.StockReviews.Any()),
            "Resolved" => query.Where(x => x.StockReviews.Any() && !x.StockReviews.Any(r => r.Status == "Pending")),
            _ => query
        };
        var totalItems = await query.CountAsync();
        var items = await IncludeRelations(query).OrderByDescending(x => x.PrescriptionDate)
            .ThenByDescending(x => x.PrescriptionId).Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize).AsSplitQuery().ToListAsync();
        return (items, totalItems);
    }

    public async Task<(int AwaitingPayment, int ReadyToDispense, int DispensedToday, int NeedsReview)>
        GetSummaryAsync(DateTime todayStart, DateTime tomorrowStart)
    {
        var today = DateOnly.FromDateTime(todayStart);
        var active = ActiveQuery();
        return (
            await WorkflowQuery(active, "AwaitingPayment", today).CountAsync(),
            await WorkflowQuery(active, "Ready", today).CountAsync(),
            await active.CountAsync(x => x.Status == PrescriptionStatusConstants.Dispensed
                && x.DispensedAt >= todayStart && x.DispensedAt < tomorrowStart),
            await WorkflowQuery(active, "NeedsReview", today).CountAsync());
    }

    public Task<Prescription?> GetByIdAsync(int prescriptionId, bool asNoTracking = true)
    {
        IQueryable<Prescription> query = context.Prescriptions;
        if (asNoTracking) query = query.AsNoTracking();
        return IncludeRelations(query).Include(x => x.DispensedByUser)
            .Include(x => x.Details).ThenInclude(x => x.DispenseDetails).ThenInclude(x => x.Inventory)
            .Include(x => x.StockReviews).ThenInclude(x => x.CreatedByUser)
            .Include(x => x.StockReviews).ThenInclude(x => x.ResolvedByUser)
            .Include(x => x.StockReviews).ThenInclude(x => x.Decisions).ThenInclude(x => x.DoctorUser)
            .AsSplitQuery().FirstOrDefaultAsync(x => x.PrescriptionId == prescriptionId);
    }

    public async Task<IReadOnlyList<Invoice>> GetPaidMedicineInvoicesAsync(
        IReadOnlyCollection<int> appointmentIds, bool onlyPaid = true)
    {
        if (appointmentIds.Count == 0) return [];
        return await context.Invoices.AsNoTracking().Include(x => x.InvoiceDetails)
            .Where(x => x.AppointmentId.HasValue && appointmentIds.Contains(x.AppointmentId.Value)
                && x.InvoiceType == "Standard" && x.OriginalInvoiceId == null
                && (x.Status == "Paid" || !onlyPaid && (x.Status == "Unpaid" || x.Status == "PartiallyPaid"))
                && (x.BillingStage == "Medicine" || x.BillingStage == "Final"))
            .OrderByDescending(x => x.Status == "Paid").ThenByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id).ToListAsync();
    }

    public async Task<Invoice?> GetPaidMedicineInvoiceAsync(int appointmentId, int prescriptionId,
        IReadOnlyCollection<int> prescriptionDetailIds, int patientId, bool onlyPaid = true)
    {
        var candidates = await GetPaidMedicineInvoicesAsync([appointmentId], onlyPaid);
        return candidates.FirstOrDefault(x => x.PatientId == patientId && (x.InvoiceDetails.Any(d =>
                d.SourceType == "Prescription" && d.SourceId == prescriptionId)
            || prescriptionDetailIds.Count > 0 && prescriptionDetailIds.All(id =>
                x.InvoiceDetails.Any(d => d.SourceType == "PrescriptionDetail" && d.SourceId == id))));
    }

    public async Task<IReadOnlyList<StockReviewRecipientResponse>> GetReviewRecipientsAsync(int doctorId, int? cashierId)
    {
        var doctor = await context.Doctors.AsNoTracking()
            .Where(x => x.DoctorId == doctorId && x.IsActive && x.User != null && x.User.Status
                && context.RolePermissions.Any(p => p.RoleId == x.User.RoleId
                    && p.PermissionCode == PermissionCodes.PharmacyPrescribe && p.Permission.IsImplemented))
            .Select(x => new StockReviewRecipientResponse(x.UserId!.Value, x.FullName, "Doctor")).ToListAsync();
        var billing = await context.Users.AsNoTracking().Where(x => x.Status
                && context.RolePermissions.Any(p => p.RoleId == x.RoleId
                    && p.PermissionCode == PermissionCodes.BillingRecordPayment && p.Permission.IsImplemented)
                && context.RolePermissions.Any(p => p.RoleId == x.RoleId
                    && p.PermissionCode == PermissionCodes.BillingCreate && p.Permission.IsImplemented))
            .Select(x => new StockReviewRecipientResponse(x.UserId, x.FullName, "Billing")).ToListAsync();
        if (cashierId.HasValue && billing.Any(x => x.UserId == cashierId))
            billing = billing.Where(x => x.UserId == cashierId).ToList();
        return doctor.Concat(billing).ToList();
    }

    public async Task AddDispenseDetailsAsync(IEnumerable<DispenseDetail> details) =>
        await context.DispenseDetails.AddRangeAsync(details);
    public async Task AddStockReviewAsync(PrescriptionStockReview review) =>
        await context.PrescriptionStockReviews.AddAsync(review);
    public async Task SaveChangesAsync() => await context.SaveChangesAsync();
    public Task<IDbContextTransaction> BeginTransactionAsync(IsolationLevel isolationLevel) =>
        context.Database.BeginTransactionAsync(isolationLevel);

    private IQueryable<Prescription> ActiveQuery() => context.Prescriptions.AsNoTracking()
        .Where(x => x.Status == PrescriptionStatusConstants.Issued || x.Status == PrescriptionStatusConstants.Dispensed);

    private IQueryable<Prescription> ReviewQuery(IQueryable<Prescription> query, DateOnly today) =>
        query.Where(x => x.Status == PrescriptionStatusConstants.Issued
            && (x.StockReviews.Any(r => r.Status == "Pending") || x.Details.Any(d =>
                d.Quantity > (d.Medicine.Inventories.Where(i => i.QuantityInStock > 0 && i.ExpiryDate >= today)
                    .Sum(i => (int?)i.QuantityInStock) ?? 0))));

    private IQueryable<Prescription> PaidQuery(IQueryable<Prescription> query) => query.Where(x =>
        context.Invoices.Any(invoice => invoice.AppointmentId == x.MedicalRecord.AppointmentId
            && invoice.PatientId == (x.MedicalRecord.PatientId ?? x.MedicalRecord.Appointment.PatientId
                ?? x.MedicalRecord.Appointment.PatientProfileId ?? 0)
            && invoice.InvoiceType == "Standard" && invoice.OriginalInvoiceId == null
            && invoice.Status == "Paid" && (invoice.BillingStage == "Medicine" || invoice.BillingStage == "Final")
            && (invoice.InvoiceDetails.Any(line => line.SourceType == "Prescription" && line.SourceId == x.PrescriptionId)
                || x.Details.Any() && x.Details.All(detail => invoice.InvoiceDetails.Any(line =>
                    line.SourceType == "PrescriptionDetail" && line.SourceId == detail.PrescriptionDetailId)))));

    private IQueryable<Prescription> WorkflowQuery(IQueryable<Prescription> query, string? status, DateOnly today)
    {
        if (status == "Dispensed") return query.Where(x => x.Status == PrescriptionStatusConstants.Dispensed);
        if (status == "NeedsReview") return ReviewQuery(query, today);
        if (status is not ("Ready" or "AwaitingPayment")) return query;
        var reviewIds = ReviewQuery(query, today).Select(x => x.PrescriptionId);
        var eligible = query.Where(x => x.Status == PrescriptionStatusConstants.Issued && !reviewIds.Contains(x.PrescriptionId));
        var paid = PaidQuery(eligible);
        var paidIds = paid.Select(x => x.PrescriptionId);
        return status == "Ready" ? paid : eligible.Where(x => !paidIds.Contains(x.PrescriptionId));
    }

    private static IQueryable<Prescription> IncludeRelations(IQueryable<Prescription> query) => query
        .Include(x => x.MedicalRecord).ThenInclude(x => x.Appointment)
        .Include(x => x.MedicalRecord).ThenInclude(x => x.Doctor)
        .Include(x => x.Details).ThenInclude(x => x.Medicine).ThenInclude(x => x.Inventories)
        .Include(x => x.StockReviews);
}

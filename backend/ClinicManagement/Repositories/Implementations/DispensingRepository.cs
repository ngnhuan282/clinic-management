using System.Data;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace ClinicManagement.Repositories.Implementations;

public class DispensingRepository : IDispensingRepository
{
    private const string PaidStatus = "Paid";
    private const string MedicineStage = "Medicine";
    private const string FinalStage = "Final";

    private readonly ApplicationDbContext _context;

    public DispensingRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<Prescription> Items, int TotalItems)>
        GetPagedAsync(DispensingFilterRequest request)
    {
        var query = BuildFilteredQuery(request);
        var totalItems = await query.CountAsync();

        var items = await IncludeListRelations(query)
            .OrderByDescending(x => x.PrescriptionDate)
            .ThenByDescending(x => x.PrescriptionId)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .AsSplitQuery()
            .ToListAsync();

        return (items, totalItems);
    }

    public async Task<(
        int AwaitingPayment,
        int ReadyToDispense,
        int DispensedToday)> GetSummaryAsync(
            DateTime todayStart,
            DateTime tomorrowStart)
    {
        var active = _context.Prescriptions.AsNoTracking()
            .Where(x =>
                x.Status == PrescriptionStatusConstants.Issued ||
                x.Status == PrescriptionStatusConstants.Dispensed
            );

        var awaitingPayment = await active.CountAsync(x =>
            x.Status == PrescriptionStatusConstants.Issued &&
            !_context.Invoices.Any(invoice =>
                invoice.AppointmentId == x.MedicalRecord.AppointmentId &&
                invoice.Status == PaidStatus &&
                (invoice.BillingStage == MedicineStage ||
                    invoice.BillingStage == FinalStage) &&
                (invoice.InvoiceDetails.Any(line =>
                    line.SourceType == "Prescription" &&
                    line.SourceId == x.PrescriptionId
                ) || x.Details.All(detail =>
                    invoice.InvoiceDetails.Any(line =>
                        line.SourceType == "PrescriptionDetail" &&
                        line.SourceId == detail.PrescriptionDetailId
                    )
                ))
            )
        );

        var readyToDispense = await active.CountAsync(x =>
            x.Status == PrescriptionStatusConstants.Issued &&
            _context.Invoices.Any(invoice =>
                invoice.AppointmentId == x.MedicalRecord.AppointmentId &&
                invoice.Status == PaidStatus &&
                (invoice.BillingStage == MedicineStage ||
                    invoice.BillingStage == FinalStage) &&
                (invoice.InvoiceDetails.Any(line =>
                    line.SourceType == "Prescription" &&
                    line.SourceId == x.PrescriptionId
                ) || x.Details.All(detail =>
                    invoice.InvoiceDetails.Any(line =>
                        line.SourceType == "PrescriptionDetail" &&
                        line.SourceId == detail.PrescriptionDetailId
                    )
                ))
            )
        );

        var dispensedToday = await active.CountAsync(x =>
            x.Status == PrescriptionStatusConstants.Dispensed &&
            x.DispensedAt >= todayStart &&
            x.DispensedAt < tomorrowStart
        );

        return (awaitingPayment, readyToDispense, dispensedToday);
    }

    public Task<Prescription?> GetByIdAsync(
        int prescriptionId,
        bool asNoTracking = true)
    {
        IQueryable<Prescription> query = _context.Prescriptions;

        if (asNoTracking)
        {
            query = query.AsNoTracking();
        }

        return IncludeDetailRelations(query)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x =>
                x.PrescriptionId == prescriptionId
            );
    }

    public async Task<IReadOnlyList<Invoice>> GetPaidMedicineInvoicesAsync(
        IReadOnlyCollection<int> appointmentIds)
    {
        if (appointmentIds.Count == 0)
        {
            return [];
        }

        return await _context.Invoices
            .AsNoTracking()
            .Include(x => x.InvoiceDetails)
            .Where(x =>
                x.AppointmentId.HasValue && appointmentIds.Contains(x.AppointmentId.Value) &&
                x.Status == PaidStatus &&
                (x.BillingStage == MedicineStage ||
                    x.BillingStage == FinalStage)
            )
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .ToListAsync();
    }

    public async Task<Invoice?> GetPaidMedicineInvoiceAsync(
        int appointmentId,
        int prescriptionId,
        IReadOnlyCollection<int> prescriptionDetailIds)
    {
        var candidates = await _context.Invoices
            .AsNoTracking()
            .Include(x => x.InvoiceDetails)
            .Where(x =>
                x.AppointmentId == appointmentId &&
                x.Status == PaidStatus &&
                (x.BillingStage == MedicineStage ||
                    x.BillingStage == FinalStage)
            )
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .ToListAsync();

        return candidates.FirstOrDefault(x =>
            IsInvoiceForPrescription(
                x,
                prescriptionId,
                prescriptionDetailIds
            )
        );
    }

    public async Task AddDispenseDetailsAsync(
        IEnumerable<DispenseDetail> dispenseDetails)
    {
        await _context.DispenseDetails.AddRangeAsync(dispenseDetails);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public Task<IDbContextTransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel)
    {
        return _context.Database.BeginTransactionAsync(isolationLevel);
    }

    private IQueryable<Prescription> BuildFilteredQuery(
        DispensingFilterRequest request)
    {
        var query = _context.Prescriptions
            .AsNoTracking()
            .Where(x =>
                x.Status == PrescriptionStatusConstants.Issued ||
                x.Status == PrescriptionStatusConstants.Dispensed
            );

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            var codePart = search.Split(
                    '-',
                    StringSplitOptions.RemoveEmptyEntries
                )
                .LastOrDefault();

            if (int.TryParse(codePart, out var prescriptionId))
            {
                query = query.Where(x =>
                    x.PrescriptionId == prescriptionId ||
                    x.MedicalRecord.Appointment.PatientName.Contains(search) ||
                    x.MedicalRecord.Appointment.PatientPhone.Contains(search)
                );
            }
            else
            {
                query = query.Where(x =>
                    x.MedicalRecord.Appointment.PatientName.Contains(search) ||
                    x.MedicalRecord.Appointment.PatientPhone.Contains(search)
                );
            }
        }

        query = ApplyWorkflowFilter(query, request.WorkflowStatus);

        if (request.FromDate.HasValue)
        {
            var from = request.FromDate.Value
                .ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.PrescriptionDate >= from);
        }

        if (request.ToDate.HasValue)
        {
            var toExclusive = request.ToDate.Value
                .AddDays(1)
                .ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.PrescriptionDate < toExclusive);
        }

        return query;
    }

    private IQueryable<Prescription> ApplyWorkflowFilter(
        IQueryable<Prescription> query,
        string? workflowStatus)
    {
        return workflowStatus?.Trim().ToLowerInvariant() switch
        {
            "awaitingpayment" => query.Where(x =>
                x.Status == PrescriptionStatusConstants.Issued &&
                !_context.Invoices.Any(invoice =>
                    invoice.AppointmentId == x.MedicalRecord.AppointmentId &&
                    invoice.Status == PaidStatus &&
                    (invoice.BillingStage == MedicineStage ||
                        invoice.BillingStage == FinalStage) &&
                    (invoice.InvoiceDetails.Any(line =>
                        line.SourceType == "Prescription" &&
                        line.SourceId == x.PrescriptionId
                    ) || x.Details.All(detail =>
                        invoice.InvoiceDetails.Any(line =>
                            line.SourceType == "PrescriptionDetail" &&
                            line.SourceId == detail.PrescriptionDetailId
                        )
                    ))
                )
            ),
            "ready" => query.Where(x =>
                x.Status == PrescriptionStatusConstants.Issued &&
                _context.Invoices.Any(invoice =>
                    invoice.AppointmentId == x.MedicalRecord.AppointmentId &&
                    invoice.Status == PaidStatus &&
                    (invoice.BillingStage == MedicineStage ||
                        invoice.BillingStage == FinalStage) &&
                    (invoice.InvoiceDetails.Any(line =>
                        line.SourceType == "Prescription" &&
                        line.SourceId == x.PrescriptionId
                    ) || x.Details.All(detail =>
                        invoice.InvoiceDetails.Any(line =>
                            line.SourceType == "PrescriptionDetail" &&
                            line.SourceId == detail.PrescriptionDetailId
                        )
                    ))
                )
            ),
            "dispensed" => query.Where(x =>
                x.Status == PrescriptionStatusConstants.Dispensed
            ),
            _ => query
        };
    }

    private static IQueryable<Prescription> IncludeListRelations(
        IQueryable<Prescription> query)
    {
        return query
            .Include(x => x.MedicalRecord)
                .ThenInclude(x => x.Appointment)
            .Include(x => x.MedicalRecord)
                .ThenInclude(x => x.Doctor)
            .Include(x => x.Details)
                .ThenInclude(x => x.Medicine);
    }

    private static bool IsInvoiceForPrescription(
        Invoice invoice,
        int prescriptionId,
        IReadOnlyCollection<int> prescriptionDetailIds)
    {
        if (invoice.InvoiceDetails.Any(x =>
                x.SourceType == "Prescription" &&
                x.SourceId == prescriptionId))
        {
            return true;
        }

        var billedDetailIds = invoice.InvoiceDetails
            .Where(x => x.SourceType == "PrescriptionDetail")
            .Select(x => x.SourceId)
            .ToHashSet();

        return prescriptionDetailIds.Count > 0 &&
            prescriptionDetailIds.All(billedDetailIds.Contains);
    }

    private static IQueryable<Prescription> IncludeDetailRelations(
        IQueryable<Prescription> query)
    {
        return IncludeListRelations(query)
            .Include(x => x.DispensedByUser)
            .Include(x => x.Details)
                .ThenInclude(x => x.Medicine)
                    .ThenInclude(x => x.Inventories)
            .Include(x => x.Details)
                .ThenInclude(x => x.DispenseDetails)
                    .ThenInclude(x => x.Inventory);
    }
}

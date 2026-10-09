using System.Data;
using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class DispensingService : IDispensingService
{
    private static DateTime ClinicNow =>
        TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
            DateTime.UtcNow,
            "Asia/Ho_Chi_Minh"
        );

    private readonly IDispensingRepository _dispensingRepository;
    private readonly ICurrentUserService _currentUser;

    public DispensingService(
        IDispensingRepository dispensingRepository,
        ICurrentUserService currentUser)
    {
        _dispensingRepository = dispensingRepository;
        _currentUser = currentUser;
    }

    public async Task<PagedResponse<DispensingListItemResponse>>
        GetPagedAsync(DispensingFilterRequest request)
    {
        var (items, totalItems) =
            await _dispensingRepository.GetPagedAsync(request);
        var prescriptions = items.ToList();
        var appointmentIds = prescriptions
            .Select(x => x.MedicalRecord.AppointmentId)
            .Distinct()
            .ToArray();
        var invoices = await _dispensingRepository
            .GetPaidMedicineInvoicesAsync(appointmentIds);

        var responses = prescriptions.Select(x =>
        {
            var invoice = FindInvoice(x, invoices);
            return x.ToDispensingListItem(invoice);
        });

        return new PagedResponse<DispensingListItemResponse>(
            responses,
            request.PageNumber,
            request.PageSize,
            totalItems
        );
    }

    public async Task<DispensingSummaryResponse> GetSummaryAsync()
    {
        var todayStart = ClinicNow.Date;
        var summary = await _dispensingRepository.GetSummaryAsync(
            todayStart,
            todayStart.AddDays(1)
        );

        return new DispensingSummaryResponse
        {
            AwaitingPayment = summary.AwaitingPayment,
            ReadyToDispense = summary.ReadyToDispense,
            DispensedToday = summary.DispensedToday
        };
    }

    public async Task<DispensingResponse> GetByIdAsync(
        int prescriptionId)
    {
        var prescription = await _dispensingRepository.GetByIdAsync(
            prescriptionId
        );

        if (prescription == null)
        {
            throw new AppException(ErrorCode.PRESCRIPTION_NOT_FOUND);
        }

        var invoice = await _dispensingRepository
            .GetPaidMedicineInvoiceAsync(
                prescription.MedicalRecord.AppointmentId,
                prescription.PrescriptionId,
                prescription.Details
                    .Select(x => x.PrescriptionDetailId)
                    .ToArray()
            );

        return prescription.ToDispensingResponse(
            invoice,
            DateOnly.FromDateTime(ClinicNow)
        );
    }

    public async Task<DispensingResponse> ConfirmAsync(
        int prescriptionId)
    {
        try
        {
            await using var transaction =
                await _dispensingRepository.BeginTransactionAsync(
                    IsolationLevel.Serializable
                );

            var prescription = await _dispensingRepository.GetByIdAsync(
                prescriptionId,
                asNoTracking: false
            );

            if (prescription == null)
            {
                throw new AppException(ErrorCode.PRESCRIPTION_NOT_FOUND);
            }

            if (prescription.Status != PrescriptionStatusConstants.Issued)
            {
                throw new AppException(
                    ErrorCode.PRESCRIPTION_INVALID_STATUS
                );
            }

            var invoice = await _dispensingRepository
                .GetPaidMedicineInvoiceAsync(
                    prescription.MedicalRecord.AppointmentId,
                    prescription.PrescriptionId,
                    prescription.Details
                        .Select(x => x.PrescriptionDetailId)
                        .ToArray()
                );

            if (invoice == null)
            {
                throw new AppException(
                    ErrorCode.PRESCRIPTION_PAYMENT_REQUIRED
                );
            }

            var allocations = BuildAllocations(
                prescription,
                DateOnly.FromDateTime(ClinicNow)
            );

            foreach (var allocation in allocations)
            {
                allocation.Inventory.QuantityInStock -= allocation.Quantity;
            }

            await _dispensingRepository.AddDispenseDetailsAsync(
                allocations.Select(x => new DispenseDetail
                {
                    PrescriptionDetailId = x.PrescriptionDetailId,
                    InventoryId = x.Inventory.InventoryId,
                    QuantityDispensed = x.Quantity
                })
            );

            var now = ClinicNow;
            prescription.Status = PrescriptionStatusConstants.Dispensed;
            prescription.DispensedAt = now;
            prescription.DispensedByUserId =
                _currentUser.GetRequiredUserId();
            prescription.UpdatedAt = DateTime.UtcNow;

            await _dispensingRepository.SaveChangesAsync();
            await transaction.CommitAsync();

            return await GetByIdAsync(prescriptionId);
        }
        catch (SqlException exception) when (exception.Number == 1205)
        {
            throw new AppException(
                ErrorCode.PRESCRIPTION_DISPENSE_CONFLICT
            );
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException
            {
                Number: 1205 or 2601 or 2627
            })
        {
            throw new AppException(
                ErrorCode.PRESCRIPTION_DISPENSE_CONFLICT
            );
        }
    }

    private static IReadOnlyList<PlannedAllocation> BuildAllocations(
        Prescription prescription,
        DateOnly today)
    {
        var allocations = new List<PlannedAllocation>();

        foreach (var detail in prescription.Details)
        {
            var remaining = detail.Quantity;
            var lots = detail.Medicine.Inventories
                .Where(x =>
                    x.QuantityInStock > 0 &&
                    x.ExpiryDate >= today
                )
                .OrderBy(x => x.ExpiryDate)
                .ThenBy(x => x.InventoryId);

            foreach (var lot in lots)
            {
                if (remaining == 0)
                {
                    break;
                }

                var quantity = Math.Min(
                    remaining,
                    lot.QuantityInStock
                );
                allocations.Add(new PlannedAllocation(
                    detail.PrescriptionDetailId,
                    lot,
                    quantity
                ));
                remaining -= quantity;
            }

            if (remaining > 0)
            {
                throw new AppException(
                    ErrorCode.PRESCRIPTION_INSUFFICIENT_STOCK,
                    $"Insufficient non-expired stock for {detail.Medicine.MedicineName}"
                );
            }
        }

        return allocations;
    }

    private static Invoice? FindInvoice(
        Prescription prescription,
        IReadOnlyList<Invoice> invoices)
    {
        var detailIds = prescription.Details
            .Select(x => x.PrescriptionDetailId)
            .ToHashSet();

        return invoices.FirstOrDefault(invoice =>
            invoice.AppointmentId ==
                prescription.MedicalRecord.AppointmentId &&
            (invoice.InvoiceDetails.Any(line =>
                line.SourceType == "Prescription" &&
                line.SourceId == prescription.PrescriptionId
            ) ||
            (detailIds.Count > 0 && detailIds.All(detailId =>
                invoice.InvoiceDetails.Any(line =>
                    line.SourceType == "PrescriptionDetail" &&
                    line.SourceId == detailId
                )
            )))
        );
    }

    private sealed record PlannedAllocation(
        int PrescriptionDetailId,
        Inventory Inventory,
        int Quantity
    );
}

using System.Data;
using System.Text.Json;
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
    private readonly INotificationService _notifications;

    public DispensingService(
        IDispensingRepository dispensingRepository,
        ICurrentUserService currentUser,
        INotificationService notifications)
    {
        _dispensingRepository = dispensingRepository;
        _currentUser = currentUser;
        _notifications = notifications;
    }

    public async Task<PagedResponse<DispensingListItemResponse>>
        GetPagedAsync(DispensingFilterRequest request)
    {
        var (items, totalItems) =
            await _dispensingRepository.GetPagedAsync(request, DateOnly.FromDateTime(ClinicNow));
        var prescriptions = items.ToList();
        var appointmentIds = prescriptions
            .Select(x => x.MedicalRecord.AppointmentId)
            .Distinct()
            .ToArray();
        var invoices = await _dispensingRepository
            .GetPaidMedicineInvoicesAsync(appointmentIds, onlyPaid: false);

        var responses = prescriptions.Select(x =>
        {
            var invoice = FindInvoice(x, invoices);
            return x.ToDispensingListItem(invoice, DateOnly.FromDateTime(ClinicNow));
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
            DispensedToday = summary.DispensedToday,
            NeedsReview = summary.NeedsReview
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
                    .ToArray(), GetBillingPatientId(prescription), onlyPaid: false
            );

        var response = prescription.ToDispensingResponse(
            invoice,
            DateOnly.FromDateTime(ClinicNow)
        );
        response.ReviewRecipients = await _dispensingRepository.GetReviewRecipientsAsync(
            prescription.MedicalRecord.DoctorId, invoice?.CashierId);
        return response;
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

            if (prescription.StockReviews.Any(x => x.Status == "Pending"))
                throw new AppException(ErrorCode.STOCK_REVIEW_PENDING);

            var invoice = await _dispensingRepository
                .GetPaidMedicineInvoiceAsync(
                    prescription.MedicalRecord.AppointmentId,
                    prescription.PrescriptionId,
                    prescription.Details
                        .Select(x => x.PrescriptionDetailId)
                        .ToArray(), GetBillingPatientId(prescription)
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
        catch (DbUpdateConcurrencyException)
        {
            throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT);
        }
        catch (SqlException exception) when (exception.Number == 1205)
        {
            throw new AppException(
                ErrorCode.PRESCRIPTION_DISPENSE_CONFLICT
            );
        }
        catch (InvalidOperationException exception) when (IsDatabaseConflict(exception))
        {
            throw new AppException(ErrorCode.PRESCRIPTION_DISPENSE_CONFLICT);
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

    public Task<DispensingResponse> RequestReviewAsync(int prescriptionId, CreateStockReviewRequest request) =>
        ProcessReviewAsync(prescriptionId, request);

    public Task<DispensingResponse> RecheckReviewAsync(int prescriptionId, RecheckStockReviewRequest request) =>
        ProcessReviewAsync(prescriptionId, null, request);

    private async Task<DispensingResponse> ProcessReviewAsync(int prescriptionId, CreateStockReviewRequest? request,
        RecheckStockReviewRequest? recheck = null)
    {
        try
        {
            await using var transaction = await _dispensingRepository.BeginTransactionAsync(IsolationLevel.Serializable);
            var prescription = await _dispensingRepository.GetByIdAsync(prescriptionId, asNoTracking: false)
                ?? throw new AppException(ErrorCode.PRESCRIPTION_NOT_FOUND);
            if (prescription.Status != PrescriptionStatusConstants.Issued)
                throw new AppException(ErrorCode.PRESCRIPTION_INVALID_STATUS);
            var pending = prescription.StockReviews.SingleOrDefault(x => x.Status == "Pending");
            var invoice = await _dispensingRepository.GetPaidMedicineInvoiceAsync(
                prescription.MedicalRecord.AppointmentId, prescriptionId,
                prescription.Details.Select(x => x.PrescriptionDetailId).ToArray(), GetBillingPatientId(prescription), onlyPaid: false);
            var response = prescription.ToDispensingResponse(invoice, DateOnly.FromDateTime(ClinicNow));
            List<Notification> notifications;
            if (request != null)
            {
                if (pending != null || response.HasSufficientStock
                    || !request.ExpectedUpdatedAt.HasValue
                    || request.ExpectedUpdatedAt.Value.ToUniversalTime() != DateTime.SpecifyKind(prescription.UpdatedAt, DateTimeKind.Utc))
                    throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT);
                var note = request.Note.Trim();
                if (note.Length < 3 || note.Length > 2000)
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                var availableRecipients = await _dispensingRepository.GetReviewRecipientsAsync(
                    prescription.MedicalRecord.DoctorId, invoice?.CashierId);
                var recipients = availableRecipients.ToList();
                if (!recipients.Any(x => x.Department == "Doctor")
                    || !recipients.Any(x => x.Department == "Billing"))
                    throw new AppException(ErrorCode.STOCK_REVIEW_RECIPIENT_UNAVAILABLE);
                var shortages = response.Medicines.Where(x => !x.IsFulfillable)
                    .Select(x => new StockReviewShortageResponse(x.MedicineId, x.MedicineName, x.Unit,
                        x.QuantityPrescribed, x.QuantityAvailable, x.QuantityPrescribed - x.QuantityAvailable)).ToList();
                var review = new PrescriptionStockReview
                {
                    PrescriptionId = prescriptionId, Note = note,
                    ShortagesJson = JsonSerializer.Serialize(shortages),
                    RecipientsJson = JsonSerializer.Serialize(recipients),
                    InvoiceId = invoice?.Id, PaymentStatus = invoice?.Status ?? "Unpaid",
                    CreatedByUserId = _currentUser.GetRequiredUserId(), CreatedAt = DateTime.UtcNow
                };
                await _dispensingRepository.AddStockReviewAsync(review);
                await _dispensingRepository.SaveChangesAsync();
                var summary = string.Join("; ", shortages.Select(x => $"{x.MedicineName}: thiếu {x.QuantityShort} {x.Unit}"));
                var message = $"{response.PatientName} · HS-{prescription.MedicalRecordId:D5} · {response.PrescriptionCode}. {summary}. "
                    + (invoice?.Status == "Paid" ? "Đã thanh toán; cần phối hợp thu phí nếu điều chỉnh đơn. " : "Chưa thanh toán. ")
                    + note;
                notifications = await _notifications.StageAsync(recipients.Select(x => x.UserId),
                    $"stock-review:{review.PrescriptionStockReviewId}:created", "Pharmacy",
                    $"Rà soát thuốc thiếu {response.PrescriptionCode}",
                    message.Length <= 500 ? message : message[..497] + "...");
            }
            else
            {
                if (pending == null) throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT);
                if (recheck == null || recheck.ExpectedReviewId != pending.PrescriptionStockReviewId
                    || recheck.ExpectedReviewUpdatedAt?.ToUniversalTime() != DateTime.SpecifyKind(pending.UpdatedAt, DateTimeKind.Utc)
                    || recheck.ExpectedPrescriptionUpdatedAt?.ToUniversalTime() != DateTime.SpecifyKind(prescription.UpdatedAt, DateTimeKind.Utc))
                    throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT);
                if (pending.IsAwaitingBilling()) throw new AppException(ErrorCode.STOCK_REVIEW_BILLING_REQUIRED);
                if (pending.GetReviewWorkflowStatus() != "WaitingPharmacyRecheck")
                    throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT);
                pending.Status = response.HasSufficientStock ? "Resolved" : "StillShortage";
                pending.ResolvedAt = DateTime.UtcNow;
                pending.UpdatedAt = DateTime.UtcNow;
                pending.ResolvedByUserId = _currentUser.GetRequiredUserId();
                var recipients = JsonSerializer.Deserialize<List<StockReviewRecipientResponse>>(pending.RecipientsJson) ?? [];
                notifications = await _notifications.StageAsync(recipients.Select(x => x.UserId)
                    .Append(pending.CreatedByUserId), $"stock-review:{pending.PrescriptionStockReviewId}:resolved", "Pharmacy",
                    $"Đã kiểm tra lại tồn {response.PrescriptionCode}",
                    response.HasSufficientStock
                        ? $"{response.PrescriptionCode} đã đủ tồn còn hạn theo đơn hiện tại. Chưa giao thuốc; không có thay đổi thanh toán trong thao tác này."
                        : $"{response.PrescriptionCode} vẫn thiếu thuốc. Vòng rà soát đã kết thúc; dược sĩ có thể gửi yêu cầu mới. Chưa giao thuốc; không thay đổi đơn, thanh toán hoặc tồn kho.");
            }
            await _dispensingRepository.SaveChangesAsync();
            await transaction.CommitAsync();
            await _notifications.PublishAsync(notifications);
            return await GetByIdAsync(prescriptionId);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT);
        }
        catch (SqlException exception) when (exception.Number == 1205)
        {
            throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT);
        }
        catch (InvalidOperationException exception) when (IsDatabaseConflict(exception))
        {
            throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT);
        }
        catch (DbUpdateException exception) when (exception.InnerException is SqlException { Number: 1205 or 2601 or 2627 })
        {
            throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT);
        }
    }

    private static bool IsDatabaseConflict(Exception exception)
    {
        // EF's SQL execution strategy may wrap both DbUpdateException and SqlException.
        for (Exception? current = exception; current != null; current = current.InnerException)
            if (current is SqlException { Number: 1205 or 2601 or 2627 }) return true;
        return false;
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
            invoice.PatientId == GetBillingPatientId(prescription) &&
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

    private static int GetBillingPatientId(Prescription prescription) =>
        prescription.MedicalRecord.PatientId ?? prescription.MedicalRecord.Appointment.PatientId
        ?? prescription.MedicalRecord.Appointment.PatientProfileId ?? 0;

    private sealed record PlannedAllocation(
        int PrescriptionDetailId,
        Inventory Inventory,
        int Quantity
    );
}

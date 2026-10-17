using System.Data;
using System.Text.Json;
using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public partial class PrescriptionService
{
    public async Task<PagedResponse<DoctorStockReviewListItem>> GetStockReviewsAsync(DoctorStockReviewFilterRequest request)
    {
        var doctorId = await RequiredReviewDoctorIdAsync();
        var (items, total) = await _prescriptionRepository.GetStockReviewsAsync(doctorId, request);
        return new(items.Select(x => new DoctorStockReviewListItem(x.PrescriptionStockReviewId, x.PrescriptionId,
            $"RX-{x.PrescriptionId:D5}", x.Prescription.MedicalRecord.Appointment.PatientName,
            x.Prescription.MedicalRecord.Appointment.PatientPhone, x.Status,
            x.Decisions.OrderByDescending(d => d.PrescriptionStockReviewDecisionId).FirstOrDefault()?.Outcome,
            x.CreatedByUser.FullName, DateTime.SpecifyKind(x.CreatedAt, DateTimeKind.Utc),
            (JsonSerializer.Deserialize<List<StockReviewShortageResponse>>(x.ShortagesJson) ?? []).Count,
            x.GetReviewWorkflowStatus())),
            request.PageNumber, request.PageSize, total);
    }

    public async Task<DoctorStockReviewResponse> GetStockReviewAsync(int reviewId)
    {
        var doctorId = await RequiredReviewDoctorIdAsync();
        var review = await _prescriptionRepository.GetStockReviewAsync(reviewId)
            ?? throw new AppException(ErrorCode.STOCK_REVIEW_NOT_FOUND);
        if (review.Prescription.MedicalRecord.DoctorId != doctorId) throw new AppException(ErrorCode.UNAUTHORIZED);
        return new()
        {
            Review = review.ToStockReviewResponse(), Prescription = review.Prescription.ToResponse(GetClinicToday()),
            PrescriptionUpdatedAt = DateTime.SpecifyKind(review.Prescription.UpdatedAt, DateTimeKind.Utc),
            HasMedicineInvoice = await _prescriptionRepository.HasMedicineInvoiceAsync(review.Prescription),
            CanRespond = review.Status == "Pending" && !review.Decisions.Any()
                && review.Prescription.Status == PrescriptionStatusConstants.Issued
                && review.Prescription.MedicalRecord.Appointment.Status is AppointmentStatusConstants.InProgress or AppointmentStatusConstants.Completed
        };
    }

    public async Task<DoctorStockReviewResponse> RespondToStockReviewAsync(int reviewId, RespondStockReviewRequest request)
    {
        var doctorId = await RequiredReviewDoctorIdAsync();
        var reason = request.Reason.Trim();
        if (reason.Length is < 3 or > 2000 || request.Action is not ("KeepPrescription" or "AdjustPrescription"))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        try
        {
            await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            var review = await _prescriptionRepository.GetStockReviewAsync(reviewId, tracking: true)
                ?? throw new AppException(ErrorCode.STOCK_REVIEW_NOT_FOUND);
            var rx = review.Prescription;
            if (rx.MedicalRecord.DoctorId != doctorId) throw new AppException(ErrorCode.UNAUTHORIZED);
            if (review.Decisions.Any()) throw new AppException(ErrorCode.STOCK_REVIEW_RESPONSE_REPEATED);
            if (review.Status != "Pending" || rx.Status != PrescriptionStatusConstants.Issued
                || !VersionMatches(request.ExpectedReviewUpdatedAt, review.UpdatedAt)
                || !VersionMatches(request.ExpectedPrescriptionUpdatedAt, rx.UpdatedAt))
                throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT);
            EnsureRecordCanBePrescribed(rx.MedicalRecord);
            var before = Snapshot(rx.Notes, rx.Details);
            var after = before;
            var outcome = "Kept";
            var reopened = false;
            List<PrescriptionDetail> details = [];
            if (request.Action == "AdjustPrescription")
            {
                ValidatePrescription(rx.PrescriptionId, request.Details);
                if (request.Notes?.Length > 1000) throw new AppException(ErrorCode.INVALID_REQUEST);
                details = await BuildDetailsAsync(request.Details);
                after = Snapshot(NormalizeOptionalText(request.Notes), details);
                if (SameClinicalSnapshot(before, after))
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                // Any invoice locks this reviewed clinical proposal until the billing owner reconciles it.
                outcome = await _prescriptionRepository.HasMedicineInvoiceAsync(rx) ? "AwaitingBilling" : "Applied";
            }
            if (outcome == "Applied")
            {
                if (!await _medicalRecordRepository.TryAdvanceVersionAsync(rx.MedicalRecord, rx.MedicalRecord.UpdatedAt))
                    throw new AppException(ErrorCode.MEDICAL_RECORD_CONFLICT);
                reopened = InvalidatePaperBookConfirmation(rx.MedicalRecord);
                rx.Notes = after.Notes;
                rx.UpdatedAt = DateTime.UtcNow;
                UpdateDetails(rx, details);
            }
            var decision = new PrescriptionStockReviewDecision
            {
                Review = review, DoctorUserId = _currentUser.GetRequiredUserId(), Action = request.Action,
                Outcome = outcome, Reason = reason, CreatedAt = DateTime.UtcNow,
                BeforeJson = JsonSerializer.Serialize(before), AfterJson = JsonSerializer.Serialize(after)
            };
            review.UpdatedAt = DateTime.UtcNow;
            _db.PrescriptionStockReviewDecisions.Add(decision);
            await _db.SaveChangesAsync();
            var recipients = JsonSerializer.Deserialize<List<StockReviewRecipientResponse>>(review.RecipientsJson) ?? [];
            var currentRecipients = await _db.Users.Where(x => x.Status && _db.RolePermissions.Any(p => p.RoleId == x.RoleId
                    && p.Permission.IsImplemented && (p.PermissionCode == PermissionCodes.PharmacyDispense
                        || p.PermissionCode == PermissionCodes.BillingRecordPayment)))
                .Select(x => x.UserId).ToListAsync();
            var summary = outcome switch
            {
                "Applied" => "Bác sĩ đã điều chỉnh đơn. Cần đối chiếu lại tồn, cập nhật sổ giấy và kiểm tra thanh toán trước khi giao.",
                "AwaitingBilling" => "Bác sĩ đã lưu phương án điều chỉnh; chưa áp dụng vào đơn. Cần thu phí đối soát hóa đơn/hoàn tiền; tiếp tục dừng giao thuốc.",
                _ => "Bác sĩ giữ nguyên đơn. Cần đối chiếu lại tồn và kiểm tra thanh toán trước khi giao."
            };
            var message = summary + " Lý do: " + reason;
            var notifications = await _notifications.StageAsync(currentRecipients.Concat(recipients.Select(x => x.UserId))
                    .Append(review.CreatedByUserId), $"stock-review:{reviewId}:decision:{decision.PrescriptionStockReviewDecisionId}",
                "Pharmacy", $"Bác sĩ phản hồi RX-{rx.PrescriptionId:D5}", message.Length <= 500 ? message : message[..497] + "...");
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            await _notifications.PublishAsync(notifications);
            if (reopened) await _notifications.PublishAppointmentChangedAsync(rx.MedicalRecord.Appointment, rx.MedicalRecord.Appointment.Status);
            return await GetStockReviewAsync(reviewId);
        }
        catch (DbUpdateConcurrencyException) { throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT); }
        catch (Exception ex) when (HasSqlConflict(ex)) { throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT); }
    }

    private async Task<int> RequiredReviewDoctorIdAsync() => await _db.Doctors.AsNoTracking()
        .Where(x => x.UserId == _currentUser.GetRequiredUserId() && x.IsActive)
        .Select(x => (int?)x.DoctorId).SingleOrDefaultAsync() ?? throw new AppException(ErrorCode.UNAUTHORIZED);

    private static StockReviewPrescriptionSnapshot Snapshot(string? notes, IEnumerable<PrescriptionDetail> details) =>
        new(NormalizeOptionalText(notes), details.OrderBy(x => x.MedicineId).Select(x =>
            new StockReviewPrescriptionItem(x.MedicineId, x.Medicine.MedicineName, x.Medicine.Unit,
                x.Quantity, x.Dosage.Trim(), x.Instructions.Trim())).ToList());

    private static bool SameClinicalSnapshot(StockReviewPrescriptionSnapshot left, StockReviewPrescriptionSnapshot right) =>
        NormalizeOptionalText(left.Notes) == NormalizeOptionalText(right.Notes)
        && left.Details.OrderBy(x => x.MedicineId)
            .Select(x => (x.MedicineId, x.Quantity, x.Dosage.Trim(), x.Instructions.Trim()))
            .SequenceEqual(right.Details.OrderBy(x => x.MedicineId)
                .Select(x => (x.MedicineId, x.Quantity, x.Dosage.Trim(), x.Instructions.Trim())));

    private static bool VersionMatches(DateTime? expected, DateTime actual) =>
        expected.HasValue && expected.Value.ToUniversalTime() == DateTime.SpecifyKind(actual, DateTimeKind.Utc);

    private static bool HasSqlConflict(Exception exception)
    {
        for (Exception? current = exception; current != null; current = current.InnerException)
            if (current is SqlException { Number: 1205 or 2601 or 2627 }) return true;
        return false;
    }
}

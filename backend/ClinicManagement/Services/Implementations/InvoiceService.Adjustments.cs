using System.Data;
using System.Text.Json;
using ClinicManagement.DTOs.Requests.Billing;
using ClinicManagement.DTOs.Responses.Billing;
using ClinicManagement.DTOs.Responses.StockReviews;
using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public partial class InvoiceService
{
    private static readonly JsonSerializerOptions BillingJson = new(JsonSerializerDefaults.Web);

    private readonly record struct InvoiceBalance(decimal Total, decimal Insurance, decimal Patient, decimal NetPaid)
    {
        public decimal Remaining => Math.Max(0, Patient - NetPaid);
    }

    private static InvoiceBalance GetBalance(Invoice invoice, InvoiceBalance adjustments) => new(
        invoice.TotalAmount + adjustments.Total, invoice.InsuranceAmount + adjustments.Insurance,
        invoice.PatientAmount + adjustments.Patient, invoice.PaidAmount + adjustments.NetPaid);

    private Task<Dictionary<int, InvoiceBalance>> ReadAdjustmentTotalsAsync(int[] ids) =>
        context.Invoices.AsNoTracking().Where(i => i.InvoiceType == "Adjustment"
            && i.OriginalInvoiceId.HasValue && ids.Contains(i.OriginalInvoiceId.Value))
            .GroupBy(i => i.OriginalInvoiceId!.Value)
            .Select(g => new { Id = g.Key, Balance = new InvoiceBalance(g.Sum(i => i.TotalAmount),
                g.Sum(i => i.InsuranceAmount), g.Sum(i => i.PatientAmount), g.Sum(i => i.PaidAmount)) })
            .ToDictionaryAsync(x => x.Id, x => x.Balance);

    private async Task<InvoiceBalance> ReadBalanceAsync(Invoice invoice) => GetBalance(invoice,
        (await ReadAdjustmentTotalsAsync([invoice.Id])).GetValueOrDefault(invoice.Id));

    private Task<bool> HasUnpricedStockProposalAsync(int invoiceId) =>
        context.PrescriptionStockReviews.AnyAsync(r => r.Status == "Pending" && r.InvoiceId.HasValue
            && (r.InvoiceId == invoiceId || context.Invoices.Any(i => i.Id == r.InvoiceId && i.OriginalInvoiceId == invoiceId))
            && r.Decisions.OrderByDescending(d => d.PrescriptionStockReviewDecisionId).Select(d => d.Outcome).FirstOrDefault() == "AwaitingBilling");

    private sealed record AdjustmentPlan(Invoice Original, InvoiceAdjustmentPreview Preview,
        PrescriptionStockReview? Review, PrescriptionStockReviewDecision? Proposal, Dictionary<int, decimal>? UnitPrices);

    public async Task<InvoiceAdjustmentPreview> PreviewAdjustmentAsync(CreateAdjustmentInvoiceDto dto) =>
        (await PrepareAdjustmentAsync(dto)).Preview;

    private async Task<AdjustmentPlan> PrepareAdjustmentAsync(CreateAdjustmentInvoiceDto dto)
    {
        var original = await context.Invoices.Include(i => i.InvoiceDetails)
            .SingleOrDefaultAsync(i => i.Id == dto.OriginalInvoiceId && i.InvoiceType == "Standard")
            ?? throw new AppException(ErrorCode.INVALID_REQUEST, "Hóa đơn gốc không hợp lệ.");
        var balance = await ReadBalanceAsync(original);
        var totalChange = dto.AdjustmentTotalAmount;
        var insuranceChange = dto.AdjustmentInsuranceAmount;
        PrescriptionStockReview? review = null;
        PrescriptionStockReviewDecision? proposal = null;
        Dictionary<int, decimal>? prices = null;

        if (dto.PrescriptionStockReviewId is int reviewId)
        {
            review = await context.PrescriptionStockReviews.Include(r => r.Decisions)
                .Include(r => r.Prescription).ThenInclude(p => p.Details)
                .Include(r => r.Prescription).ThenInclude(p => p.MedicalRecord).ThenInclude(m => m.Appointment)
                .AsSplitQuery().SingleOrDefaultAsync(r => r.PrescriptionStockReviewId == reviewId)
                ?? throw new AppException(ErrorCode.STOCK_REVIEW_NOT_FOUND);
            var rx = review.Prescription;
            var visit = rx.MedicalRecord.Appointment;
            proposal = review.Decisions.MaxBy(d => d.PrescriptionStockReviewDecisionId);
            if (review.Status != "Pending" || rx.Status != PrescriptionStatusConstants.Issued
                || visit.Status is not (AppointmentStatusConstants.InProgress or AppointmentStatusConstants.Completed)
                || proposal is not { Action: "AdjustPrescription", Outcome: "AwaitingBilling" }
                || original.AppointmentId != visit.AppointmentId
                || original.PatientId != (rx.MedicalRecord.PatientId ?? visit.PatientId ?? visit.PatientProfileId)
                || original.BillingStage is not ("Medicine" or "Final"))
                throw new AppException(ErrorCode.STOCK_REVIEW_BILLING_REQUIRED);

            var previous = await context.PrescriptionStockReviewDecisions.AsNoTracking()
                .Where(d => d.Review.PrescriptionId == rx.PrescriptionId
                    && d.Action == StockReviewBillingConfirmation.BillingAction
                    && d.Outcome == StockReviewBillingConfirmation.VerifiedOutcome
                    && d.Review.Decisions.Any(a => a.Action == StockReviewBillingConfirmation.ApplyAction))
                .OrderByDescending(d => d.PrescriptionStockReviewDecisionId).FirstOrDefaultAsync();
            var prior = previous == null ? null : JsonSerializer.Deserialize<StockReviewBillingConfirmation>(previous.AfterJson, BillingJson);
            var coversPrescription = original.InvoiceDetails.Any(d => d.SourceType == "Prescription" && d.SourceId == rx.PrescriptionId)
                || rx.Details.Count > 0 && rx.Details.All(d => original.InvoiceDetails.Any(line =>
                    line.SourceType == "PrescriptionDetail" && line.SourceId == d.PrescriptionDetailId));
            if ((!coversPrescription && prior?.OriginalInvoiceId != original.Id)
                || (review.InvoiceId.HasValue && review.InvoiceId != original.Id && review.InvoiceId != prior?.AdjustmentInvoiceId))
                throw new AppException(ErrorCode.STOCK_REVIEW_BILLING_REQUIRED);

            var before = JsonSerializer.Deserialize<StockReviewPrescriptionSnapshot>(proposal.BeforeJson)!;
            var after = JsonSerializer.Deserialize<StockReviewPrescriptionSnapshot>(proposal.AfterJson)!;
            if (!before.Details.OrderBy(d => d.MedicineId).Select(d => (d.MedicineId, d.Quantity))
                .SequenceEqual(rx.Details.OrderBy(d => d.MedicineId).Select(d => (d.MedicineId, d.Quantity))))
                throw new AppException(ErrorCode.STOCK_REVIEW_CONFLICT);
            var medicineIds = before.Details.Concat(after.Details).Select(d => d.MedicineId).Distinct().ToArray();
            prices = await context.Medicines.Where(m => medicineIds.Contains(m.MedicineId))
                .ToDictionaryAsync(m => m.MedicineId, m => m.UnitPrice);
            foreach (var detail in rx.Details)
            {
                if (prior?.UnitPrices?.TryGetValue(detail.MedicineId, out var previousPrice) == true)
                    prices[detail.MedicineId] = previousPrice;
                else if (original.InvoiceDetails.FirstOrDefault(d => d.SourceType == "PrescriptionDetail"
                    && d.SourceId == detail.PrescriptionDetailId) is { } line)
                    prices[detail.MedicineId] = line.UnitPrice;
            }
            if (prices.Count != medicineIds.Length) throw new AppException(ErrorCode.INVALID_REQUEST);
            totalChange = after.Details.Sum(d => prices[d.MedicineId] * d.Quantity)
                - before.Details.Sum(d => prices[d.MedicineId] * d.Quantity);
            insuranceChange = Math.Round((balance.Total + totalChange) * original.InsuranceDiscountPercent / 100m)
                - balance.Insurance;
        }
        else
        {
            var linkedOriginal = await context.PrescriptionStockReviews.AnyAsync(r => r.Status == "Pending"
                && (r.InvoiceId == original.Id || original.AppointmentId.HasValue
                    && r.Prescription.MedicalRecord.AppointmentId == original.AppointmentId
                    && (original.BillingStage == "Medicine" || original.BillingStage == "Final"))
                && r.Decisions.Any(d => d.Outcome == "AwaitingBilling"));
            if (linkedOriginal) throw new AppException(ErrorCode.INVALID_REQUEST, "Hãy đối soát bằng mã phiếu rà soát của đơn thuốc.");
        }

        var patientChange = totalChange - insuranceChange;
        var revisedPatient = balance.Patient + patientChange;
        if (revisedPatient < 0 || balance.Insurance + insuranceChange < 0
            || totalChange != decimal.Round(totalChange, 2) || insuranceChange != decimal.Round(insuranceChange, 2)
            || (review == null && totalChange == 0 && insuranceChange == 0))
            throw new AppException(ErrorCode.INVALID_REQUEST, "Khoản điều chỉnh không hợp lệ hoặc làm số phải trả âm.");
        var preview = new InvoiceAdjustmentPreview(totalChange, insuranceChange, patientChange, revisedPatient,
            balance.NetPaid, Math.Max(0, balance.NetPaid - revisedPatient), Math.Max(0, revisedPatient - balance.NetPaid));
        if (original.BillingStage == "Book" && original.Status == "Paid" && preview.RemainingAmount > 0)
            throw new AppException(ErrorCode.BOOK_INVOICE_INVALID_STATUS);
        return new AdjustmentPlan(original, preview, review, proposal, prices);
    }

    public async Task<InvoiceResponseDto> CreateAdjustmentInvoiceAsync(int cashierId, CreateAdjustmentInvoiceDto dto)
    {
        try { return await CreateAdjustmentCoreAsync(cashierId, dto); }
        catch (Exception error) when (IsPaymentConflict(error))
        { throw new AppException(ErrorCode.DATA_CONCURRENCY_CONFLICT); }
    }

    private async Task<InvoiceResponseDto> CreateAdjustmentCoreAsync(int cashierId, CreateAdjustmentInvoiceDto dto)
    {
        var reason = dto.Reason?.Trim();
        if (string.IsNullOrEmpty(reason) || reason.Length > 450 || dto.ReferenceCode?.Length > 100
            || dto.PaymentMethod is not ("Cash" or "Transfer" or "CreditCard"))
            throw new AppException(ErrorCode.INVALID_REQUEST, "Kiểm tra lý do, phương thức và mã giao dịch.");

        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var plan = await PrepareAdjustmentAsync(dto);
        var original = plan.Original;
        var preview = plan.Preview;
        if (dto.AdjustmentTotalAmount != preview.TotalChange || dto.AdjustmentInsuranceAmount != preview.InsuranceChange
            || dto.AdjustmentPatientAmount != preview.PatientChange)
            throw new AppException(ErrorCode.INVALID_REQUEST, "Số tiền đối soát không khớp phương án đã đề xuất.");
        if ((dto.ExpectedRefundAmount.HasValue && preview.RefundAmount != dto.ExpectedRefundAmount)
            || (dto.ExpectedRemainingAmount.HasValue && preview.RemainingAmount != dto.ExpectedRemainingAmount)
            || (dto.ExpectedPatientAmount.HasValue && preview.PatientAmount != dto.ExpectedPatientAmount)
            || (dto.ExpectedNetPaid.HasValue && preview.NetPaid != dto.ExpectedNetPaid))
            throw new AppException(ErrorCode.DATA_CONCURRENCY_CONFLICT);

        var wasPaid = original.Status == "Paid";
        var now = DateTime.UtcNow;
        var adjustment = new Invoice
        {
            AppointmentId = original.AppointmentId, PatientId = original.PatientId, CashierId = cashierId,
            BillingStage = original.BillingStage, InvoiceType = "Adjustment", OriginalInvoiceId = original.Id,
            PaymentMethod = dto.PaymentMethod, Status = preview.RefundAmount > 0 ? "Refunded" : "Adjusted",
            CreatedAt = now, TotalAmount = preview.TotalChange, InsuranceAmount = preview.InsuranceChange,
            PatientAmount = preview.PatientChange, PaidAmount = -preview.RefundAmount,
            InvoiceDetails = [new InvoiceDetail
            {
                SourceType = "Adjustment", SourceId = original.Id, ItemName = reason,
                Quantity = 1, UnitPrice = preview.TotalChange, TotalPrice = preview.TotalChange
            }]
        };
        if (preview.RefundAmount > 0)
        {
            adjustment.Payments.Add(new InvoicePayment
            {
                ReceiptNumber = await GenerateReceiptNumberAsync("PH"), PaymentType = "Refund",
                Amount = preview.RefundAmount, PaymentMethod = dto.PaymentMethod, ReferenceCode = dto.ReferenceCode?.Trim(),
                Note = reason, CashierId = cashierId, PaidAt = now
            });
        }
        original.Status = ResolvePaymentStatus(preview.PatientAmount, preview.NetPaid - preview.RefundAmount);
        context.Invoices.Add(adjustment);
        await context.SaveChangesAsync();

        List<Notification> reviewNotifications = [];
        if (plan.Review is { } review && plan.Proposal is { } proposal)
        {
            var evidence = new StockReviewBillingConfirmation(proposal.PrescriptionStockReviewDecisionId,
                original.Id, adjustment.Id, plan.UnitPrices);
            review.InvoiceId = original.Id;
            review.PaymentStatus = original.Status;
            AddBillingDecision(review, cashierId, evidence, reason, original.Status == "Paid");
            if (original.Status == "Paid")
                reviewNotifications = await StageBillingReviewReadyAsync(review, proposal);
        }
        List<BookInvoice> books = [];
        List<Notification> bookNotifications = [];
        if (original.BillingStage == "Book" && !wasPaid && original.Status == "Paid")
            bookNotifications = await SyncBookInvoicesPaidAsync(original, books);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        await notifications.PublishAsync(reviewNotifications.Concat(bookNotifications));
        foreach (var book in books) await notifications.PublishBookInvoiceChangedAsync(book);
        return (await GetInvoiceByIdAsync(adjustment.Id))!;
    }

    private static void AddBillingDecision(PrescriptionStockReview review, int cashierId,
        StockReviewBillingConfirmation evidence, string reason, bool settled)
    {
        review.UpdatedAt = DateTime.UtcNow;
        if (settled) review.PaymentStatus = StockReviewBillingConfirmation.SettledPaymentStatus;
        review.Decisions.Add(new PrescriptionStockReviewDecision
        {
            DoctorUserId = cashierId, Action = StockReviewBillingConfirmation.BillingAction, Reason = reason,
            Outcome = settled ? StockReviewBillingConfirmation.VerifiedOutcome : StockReviewBillingConfirmation.PendingPaymentOutcome,
            BeforeJson = "{}", AfterJson = JsonSerializer.Serialize(evidence, BillingJson), CreatedAt = review.UpdatedAt
        });
    }

    private async Task<List<Notification>> VerifyPendingReviewAsync(int originalId, int cashierId)
    {
        var reviews = await context.PrescriptionStockReviews.Include(r => r.Decisions)
            .Where(r => r.Status == "Pending" && r.InvoiceId == originalId).ToListAsync();
        foreach (var review in reviews)
        {
            var latest = review.Decisions.MaxBy(d => d.PrescriptionStockReviewDecisionId);
            if (latest?.Outcome != StockReviewBillingConfirmation.PendingPaymentOutcome) continue;
            var evidence = JsonSerializer.Deserialize<StockReviewBillingConfirmation>(latest.AfterJson, BillingJson);
            if (evidence?.OriginalInvoiceId != originalId || !await context.Invoices.AnyAsync(i =>
                i.Id == evidence.AdjustmentInvoiceId && i.OriginalInvoiceId == originalId && i.InvoiceType == "Adjustment")) continue;
            var proposal = review.Decisions.Single(d => d.PrescriptionStockReviewDecisionId == evidence.ProposalDecisionId);
            AddBillingDecision(review, cashierId, evidence, "Đã thu đủ số tiền sau điều chỉnh.", settled: true);
            return await StageBillingReviewReadyAsync(review, proposal);
        }
        return [];
    }

    private Task<List<Notification>> StageBillingReviewReadyAsync(PrescriptionStockReview review, PrescriptionStockReviewDecision proposal) =>
        notifications.StageAsync([proposal.DoctorUserId], $"stock-review:{review.PrescriptionStockReviewId}:billing-verified",
            "Pharmacy", "Đã đối soát đơn thuốc",
            $"Phiếu rà soát #{review.PrescriptionStockReviewId} đã thu đủ. Có thể áp dụng phương án đơn thuốc.");
}

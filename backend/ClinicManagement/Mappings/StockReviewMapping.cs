using System.Text.Json;
using ClinicManagement.DTOs.Responses.StockReviews;
using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;

namespace ClinicManagement.Mappings;

public static class StockReviewMapping
{
    public static StockReviewResponse ToStockReviewResponse(this PrescriptionStockReview review) => new()
    {
        ReviewId = review.PrescriptionStockReviewId, Status = review.Status,
        WorkflowStatus = review.GetReviewWorkflowStatus(), Note = review.Note,
        InvoiceId = review.InvoiceId, PaymentStatus = review.PaymentStatus,
        CreatedByName = review.CreatedByUser.FullName,
        CreatedAt = DateTime.SpecifyKind(review.CreatedAt, DateTimeKind.Utc),
        UpdatedAt = DateTime.SpecifyKind(review.UpdatedAt, DateTimeKind.Utc),
        ResolvedByName = review.ResolvedByUser?.FullName,
        ResolvedAt = review.ResolvedAt.HasValue ? DateTime.SpecifyKind(review.ResolvedAt.Value, DateTimeKind.Utc) : null,
        Shortages = JsonSerializer.Deserialize<List<StockReviewShortageResponse>>(review.ShortagesJson) ?? [],
        Recipients = JsonSerializer.Deserialize<List<StockReviewRecipientResponse>>(review.RecipientsJson) ?? [],
        Decisions = review.Decisions.OrderByDescending(x => x.PrescriptionStockReviewDecisionId).Select(x =>
            new StockReviewDecisionResponse(x.PrescriptionStockReviewDecisionId, x.Action, x.Outcome, x.Reason,
                x.DoctorUser.FullName, DateTime.SpecifyKind(x.CreatedAt, DateTimeKind.Utc),
                x.Action == StockReviewBillingConfirmation.BillingAction ? null : JsonSerializer.Deserialize<StockReviewPrescriptionSnapshot>(x.BeforeJson),
                x.Action == StockReviewBillingConfirmation.BillingAction ? null : JsonSerializer.Deserialize<StockReviewPrescriptionSnapshot>(x.AfterJson))).ToList()
    };

    public static bool IsAwaitingBilling(this PrescriptionStockReview review) =>
        review.Decisions.MaxBy(x => x.PrescriptionStockReviewDecisionId) is { } latest
        && (latest.Action == StockReviewBillingConfirmation.BillingAction || latest.Outcome == "AwaitingBilling");

    public static bool HasAppliedBillingProposal(this Prescription prescription) =>
        prescription.StockReviews.Any(r => r.Decisions.Any(d => d.Action == StockReviewBillingConfirmation.ApplyAction));

    public static string GetReviewWorkflowStatus(this PrescriptionStockReview review) => review.Status switch
    {
        "Resolved" => "Completed",
        "StillShortage" => "StillShortage",
        _ when review.IsAwaitingBilling() => "WaitingBilling",
        _ => review.Decisions.OrderByDescending(x => x.PrescriptionStockReviewDecisionId).FirstOrDefault()?.Outcome switch
        {
            "Kept" or "Applied" => "WaitingPharmacyRecheck",
            _ => "PendingDoctor"
        }
    };
}

namespace ClinicManagement.Commons;

// Billing writes this payload to AfterJson on a BillingAdjusted / BillingVerified decision
// and updates the review version in the same transaction once its revised charges are fully settled.
public sealed record StockReviewBillingConfirmation(
    int ProposalDecisionId, int OriginalInvoiceId, int AdjustmentInvoiceId,
    Dictionary<int, decimal>? UnitPrices = null)
{
    public const string BillingAction = "BillingAdjusted";
    public const string VerifiedOutcome = "BillingVerified";
    public const string PendingPaymentOutcome = "BillingPendingPayment";
    public const string ApplyAction = "ApplyBillingProposal";
    public const string SettledPaymentStatus = "ReconciledPaid";
}

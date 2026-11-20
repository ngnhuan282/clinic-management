namespace ClinicManagement.DTOs.Responses.Billing;

public sealed record PatientInvoiceResponse(string Source, int Id, int? OriginalInvoiceId, int? AppointmentId,
    string BillingStage, string Status, DateTime CreatedAt, decimal TotalAmount, decimal InsuranceAmount,
    decimal PatientAmount, decimal PaidAmount, decimal RemainingAmount,
    IReadOnlyList<PatientInvoiceLine> Details, IReadOnlyList<PatientInvoicePayment> Payments);

public sealed record PatientInvoiceLine(string Name, int Quantity, decimal UnitPrice, decimal Total);
public sealed record PatientInvoicePayment(string? ReceiptNumber, string Type, string? Method, decimal Amount, DateTime PaidAt);

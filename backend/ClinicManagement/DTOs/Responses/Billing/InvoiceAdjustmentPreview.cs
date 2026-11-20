namespace ClinicManagement.DTOs.Responses.Billing;

public record InvoiceAdjustmentPreview(decimal TotalChange, decimal InsuranceChange, decimal PatientChange,
    decimal PatientAmount, decimal NetPaid, decimal RefundAmount, decimal RemainingAmount);

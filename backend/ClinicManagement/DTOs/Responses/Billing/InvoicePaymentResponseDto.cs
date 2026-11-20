namespace ClinicManagement.DTOs.Responses.Billing;

public class InvoicePaymentResponseDto
{
    public int Id { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public string PaymentType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? ReferenceCode { get; set; }
    public string? Note { get; set; }
    public int CashierId { get; set; }
    public DateTime PaidAt { get; set; }
}

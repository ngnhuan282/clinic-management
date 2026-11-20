namespace ClinicManagement.DTOs.Requests.Billing;

public class RecordInvoicePaymentDto
{
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? ReferenceCode { get; set; }
    public string? Note { get; set; }
}

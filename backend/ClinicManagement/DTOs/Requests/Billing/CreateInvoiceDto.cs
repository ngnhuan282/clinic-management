namespace ClinicManagement.DTOs.Requests.Billing;

public class CreateInvoiceItemDto
{
    public string SourceType { get; set; } = string.Empty;
    public int SourceId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
}

public class CreateInvoiceDto
{
    public int? AppointmentId { get; set; }
    public int PatientId { get; set; }
    public string BillingStage { get; set; } = "Pending";
    public string PaymentMethod { get; set; } = "Cash";
    public decimal InsuranceDiscountPercent { get; set; } = 0;

    // Cho phép lập hóa đơn trước (0đ), thu một phần, hoặc thu đủ
    public decimal? InitialPaymentAmount { get; set; }
    public string? ReferenceCode { get; set; }
    public string? PaymentNote { get; set; }

    public List<CreateInvoiceItemDto> Items { get; set; } = new();
}

namespace ClinicManagement.DTOs.Responses;

public class PatientMedicineBillingResponse
{
    public decimal? TotalMedicineAmount { get; set; }
    public IReadOnlyList<PatientMedicineInvoiceResponse> Invoices { get; set; } = [];
}

public class PatientMedicineInvoiceResponse
{
    public int InvoiceId { get; set; }
    public string BillingStage { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal MedicineAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal? InsuranceAmount { get; set; }
    public decimal? PatientAmount { get; set; }
    public IReadOnlyList<PatientMedicineInvoiceItemResponse> Details { get; set; } = [];
}

public class PatientMedicineInvoiceItemResponse
{
    public int InvoiceDetailId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public bool IsPrescriptionMedicine { get; set; }
}

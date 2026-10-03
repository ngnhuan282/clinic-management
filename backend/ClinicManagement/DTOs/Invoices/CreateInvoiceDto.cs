using System.Collections.Generic;

namespace ClinicManagement.DTOs.Invoices
{
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
        public List<CreateInvoiceItemDto> Items { get; set; } = new();
    }
}
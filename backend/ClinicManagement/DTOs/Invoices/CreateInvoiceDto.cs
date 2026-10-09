// using System.Collections.Generic;

// namespace ClinicManagement.DTOs.Invoices
// {
//     public class CreateInvoiceItemDto
//     {
//         public string SourceType { get; set; } = string.Empty;
//         public int SourceId { get; set; }
//         public string ItemName { get; set; } = string.Empty;
//         public decimal UnitPrice { get; set; }
//         public int Quantity { get; set; } = 1;
//     }

//     public class CreateInvoiceDto
//     {
//       public int? AppointmentId { get; set; }
//         public int PatientId { get; set; }
//         public string BillingStage { get; set; } = "Pending";
//         public string PaymentMethod { get; set; } = "Cash";
//         public List<CreateInvoiceItemDto> Items { get; set; } = new();
//     }
// }
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

        // Bổ sung các trường BHYT
        public decimal InsuranceDiscountPercent { get; set; } = 0; // Tỷ lệ BHYT (ví dụ: 80)
        public decimal InsuranceAmount { get; set; } = 0;          // Số tiền BHYT chi trả
        public decimal TotalAmount { get; set; } = 0;              // Tổng chi phí gốc
        public decimal PatientAmount { get; set; } = 0;            // Tiền BN thực trả

        public List<CreateInvoiceItemDto> Items { get; set; } = new();
    }

    public class InvoiceDetailResponseDto
    {
        public int Id { get; set; }
        public string SourceType { get; set; } = string.Empty;
        public int SourceId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal TotalPrice { get; set; }
    }

    
}
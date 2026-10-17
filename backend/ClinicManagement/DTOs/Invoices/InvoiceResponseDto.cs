// using System;
// using System.Collections.Generic;

// namespace ClinicManagement.DTOs.Invoices
// {
//     public class InvoiceDetailResponseDto
//     {
//         public int Id { get; set; }
//         public string SourceType { get; set; } = string.Empty;
//         public int SourceId { get; set; }
//         public string ItemName { get; set; } = string.Empty;
//         public decimal UnitPrice { get; set; }
//         public int Quantity { get; set; }
//         public decimal TotalPrice { get; set; }
//     }

//     public class InvoiceResponseDto
//     {
//         public int Id { get; set; }
//        public int? AppointmentId { get; set; }
//         public int PatientId { get; set; }
//         public int CashierId { get; set; }
//         public string BillingStage { get; set; } = string.Empty;
//         public decimal TotalAmount { get; set; }
//         public string PaymentMethod { get; set; } = string.Empty;
//         public string Status { get; set; } = string.Empty;
//         public DateTime CreatedAt { get; set; }
//         public List<InvoiceDetailResponseDto> Details { get; set; } = new();
//     }
// }
using System;
using System.Collections.Generic;

namespace ClinicManagement.DTOs.Invoices
{
    public class InvoiceResponseDto
    {
        public int Id { get; set; }
        public int? AppointmentId { get; set; }
        public int PatientId { get; set; }
        public int CashierId { get; set; }
        public string BillingStage { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        
        // Các trường BHYT
        public decimal InsuranceDiscountPercent { get; set; }
        public decimal InsuranceAmount { get; set; }
        public decimal PatientAmount { get; set; }

        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<InvoiceDetailResponseDto> Details { get; set; } = new();
    }
}
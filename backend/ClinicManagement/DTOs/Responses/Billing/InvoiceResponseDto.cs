using System;
using System.Collections.Generic;

namespace ClinicManagement.DTOs.Responses.Billing
{
    
   

    public class InvoiceResponseDto
    {
        public int Id { get; set; }
        public int? AppointmentId { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string? PatientPhone { get; set; }
        public int CashierId { get; set; }
        public string BillingStage { get; set; } = string.Empty;

        public string InvoiceType { get; set; } = "Standard";
        public int? OriginalInvoiceId { get; set; }

        public decimal TotalAmount { get; set; }

        // Các trường BHYT
        public decimal InsuranceDiscountPercent { get; set; }
        public decimal InsuranceAmount { get; set; }
        public decimal PatientAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public decimal OriginalPatientAmount { get; set; }
        public int? PendingStockReviewId { get; set; }

        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public List<InvoiceDetailResponseDto> Details { get; set; } = new();
        public List<InvoicePaymentResponseDto> Payments { get; set; } = new();
    }
}

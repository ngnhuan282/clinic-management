using System;
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
        public decimal InsuranceDiscountPercent { get; set; } = 0;

        // Cho phép lập hóa đơn trước (0đ), thu một phần, hoặc thu đủ
        public decimal? InitialPaymentAmount { get; set; }
        public string? ReferenceCode { get; set; }
        public string? PaymentNote { get; set; }

        public List<CreateInvoiceItemDto> Items { get; set; } = new();
    }

    public class RecordInvoicePaymentDto
    {
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Cash";
        public string? ReferenceCode { get; set; }
        public string? Note { get; set; }
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

    
}
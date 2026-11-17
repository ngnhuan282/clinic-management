using System;
using System.Collections.Generic;

namespace ClinicManagement.Data.Entities
{
    public class Invoice
    {
        public int Id { get; set; }
        public int? AppointmentId { get; set; }
        public int PatientId { get; set; }
        public int CashierId { get; set; }
        public string BillingStage { get; set; } = "Pending"; // "Book", "Pending", "LabAndConsultation", "Medicine", "Final"

        // Chứng từ điều chỉnh
        public string InvoiceType { get; set; } = "Standard"; // "Standard", "Adjustment"
        public int? OriginalInvoiceId { get; set; }

        // Giá trị tài chính
        public decimal TotalAmount { get; set; }
        public decimal InsuranceDiscountPercent { get; set; } = 0;
        public decimal InsuranceAmount { get; set; } = 0;
        public decimal PatientAmount { get; set; } = 0;
        public decimal PaidAmount { get; set; } = 0; // Tổng thực thu / thực hoàn lũy kế

        public string PaymentMethod { get; set; } = "Cash";
        public string Status { get; set; } = "Unpaid"; // "Unpaid", "PartiallyPaid", "Paid", "Refunded"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<InvoiceDetail> InvoiceDetails { get; set; } = new();
        public List<InvoicePayment> Payments { get; set; } = new();
    }
}
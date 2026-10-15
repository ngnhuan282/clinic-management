using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Data.Entities
{
    public class Invoice
    {
        public int Id { get; set; }
        public int? AppointmentId { get; set; }
        public int PatientId { get; set; }
        public int CashierId { get; set; }
        public string BillingStage { get; set; } = "Pending"; // "Pending", "LabAndConsultation", "Medicine"

        // === BỔ SUNG PHỤC VỤ CHỨNG TỪ ĐIỀU CHỈNH ===
        public string InvoiceType { get; set; } = "Standard"; // "Standard", "Adjustment"
        public int? OriginalInvoiceId { get; set; }          // ID của Hóa đơn gốc nếu đây là chứng từ điều chỉnh
        // ===========================================

        // Giá trị tài chính
        public decimal TotalAmount { get; set; }               // Tổng chi phí gốc
        public decimal InsuranceDiscountPercent { get; set; } = 0; // Tỷ lệ % BHYT (0 - 100)
        public decimal InsuranceAmount { get; set; } = 0;          // Tiền BHYT trả
        public decimal PatientAmount { get; set; } = 0;            // Tiền bệnh nhân trả thực tế
        public string PaymentMethod { get; set; } = "Cash"; // Cash, CreditCard, Transfer
        public string Status { get; set; } = "Paid";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<InvoiceDetail> InvoiceDetails { get; set; } = new();
    }
}
using System;

namespace ClinicManagement.Data.Entities
{
    public class InvoicePayment
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public string ReceiptNumber { get; set; } = string.Empty; // VD: PT-20261117-0001
        public string PaymentType { get; set; } = "Payment";      // "Payment" (Thu), "Refund" (Hoàn tiền)
        public decimal Amount { get; set; }                       // Số tiền giao dịch (> 0)
        public string PaymentMethod { get; set; } = "Cash";       // Cash, Transfer, CreditCard
        public string? ReferenceCode { get; set; }                // Mã giao dịch chuyển khoản / chứng từ đối chiếu
        public string? Note { get; set; }
        public int CashierId { get; set; }
        public DateTime PaidAt { get; set; } = DateTime.UtcNow;

        public Invoice? Invoice { get; set; }
    }
}
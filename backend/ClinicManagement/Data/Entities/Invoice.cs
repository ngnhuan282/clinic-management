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
        public string BillingStage { get; set; } = "Pending"; // "Pending" hoặc "LabAndConsultation"
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; } = "Cash"; // Cash, CreditCard, Transfer
        public string Status { get; set; } = "Paid";
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public List<InvoiceDetail> InvoiceDetails { get; set; } = new();
    }
}
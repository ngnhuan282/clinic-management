namespace ClinicManagement.Data.Entities
{
    public class InvoiceDetail
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public string SourceType { get; set; } = string.Empty; // "Appointment", "LabTest", "Prescription"
        public int SourceId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal TotalPrice { get; set; }

        public Invoice? Invoice { get; set; }
    }
}
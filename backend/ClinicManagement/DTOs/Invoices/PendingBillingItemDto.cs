namespace ClinicManagement.DTOs.Invoices
{
    public class PendingBillingItemDto
    {
        public string SourceType { get; set; } = string.Empty; // "Appointment" hoặc "LabTest"
        public int SourceId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal TotalPrice { get; set; }
    }

    public class PendingAppointmentBillingDto
    {
        public int AppointmentId { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string BillingStage { get; set; } = string.Empty;
        public List<PendingBillingItemDto> Items { get; set; } = new();
    }
}
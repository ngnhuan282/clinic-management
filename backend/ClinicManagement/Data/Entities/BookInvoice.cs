namespace ClinicManagement.Data.Entities;

public class BookInvoice
{
    public int BookInvoiceId { get; set; }
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Unpaid";
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public PatientBook? PatientBook { get; set; }
}

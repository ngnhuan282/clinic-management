namespace ClinicManagement.Data.Entities;

public class PatientBookRequest
{
    public int PatientBookRequestId { get; set; }
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public string Reason { get; set; } = string.Empty;
    public int RequestedByUserId { get; set; }
    public User RequestedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public int? BookInvoiceId { get; set; }
    public BookInvoice? BookInvoice { get; set; }
}

namespace ClinicManagement.Data.Entities;

public class PatientBook
{
    public int PatientBookId { get; set; }

    public int? PreviousBookId { get; set; }
    public PatientBook? PreviousBook { get; set; }

    public DateTime IssuedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public string BookNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "Issued";

    public int? BookInvoiceId { get; set; }
    public BookInvoice? BookInvoice { get; set; }
}
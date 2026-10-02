namespace ClinicManagement.Data.Entities;

public class PatientBook
{
    public int PatientBookId { get; set; }

    public int? PatientId { get; set; }

    public User? Patient { get; set; }

    public string? BookNumber { get; set; }

    public string Status { get; set; } = string.Empty;

    public int? PreviousBookId { get; set; }

    public PatientBook? PreviousBook { get; set; }

    public DateTime? IssuedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

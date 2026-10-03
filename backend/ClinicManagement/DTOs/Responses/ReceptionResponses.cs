namespace ClinicManagement.DTOs.Responses;

public class PatientMatchResponse
{
    public int PatientId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string? IdentityNumber { get; set; }
    public string? InsuranceCode { get; set; }
}

public class PatientBookResponse
{
    public int PatientBookId { get; set; }
    public int PatientId { get; set; }
    public int? BookInvoiceId { get; set; }
    public string BookNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
}

public class BookInvoiceResponse
{
    public int BookInvoiceId { get; set; }
    public int PatientId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
}

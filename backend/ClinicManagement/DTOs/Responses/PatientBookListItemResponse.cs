namespace ClinicManagement.DTOs.Responses;

public class PatientBookListItemResponse
{
    public int PatientBookId { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public int? BookInvoiceId { get; set; }
    public int? PreviousBookId { get; set; }
    public string BookNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
}

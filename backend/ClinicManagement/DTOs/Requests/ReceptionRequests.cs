using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class MatchAppointmentPatientRequest
{
    public int? PatientProfileId { get; set; }
}

public class IssueBookRequest
{
    [Required, StringLength(40)]
    public string BookNumber { get; set; } = string.Empty;
}

public class CheckInAppointmentRequest
{
    [Range(1, int.MaxValue)]
    public int PatientProfileId { get; set; }
    [Range(1, int.MaxValue)]
    public int PatientBookId { get; set; }
    public bool BookPresented { get; set; }
}

public class RegisterExistingBookRequest
{
    [Required, StringLength(40)]
    public string BookNumber { get; set; } = string.Empty;
    public bool BookPresented { get; set; }
}

public class CreateBookInvoiceRequest
{
    [Range(0.01, 1000000000)]
    public decimal Amount { get; set; }
}

namespace ClinicManagement.Data.Entities;

public class Patient
{
    public int PatientId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string? IdentityNumber { get; set; }
    public string? InsuranceCode { get; set; }
    public DateTime CreatedAt { get; set; }
}

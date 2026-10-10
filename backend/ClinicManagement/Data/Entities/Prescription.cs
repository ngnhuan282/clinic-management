namespace ClinicManagement.Data.Entities;

public class Prescription
{
    public int PrescriptionId { get; set; }

    public int MedicalRecordId { get; set; }

    public MedicalRecord MedicalRecord { get; set; } = null!;

    public DateTime PrescriptionDate { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime? DispensedAt { get; set; }

    public int? DispensedByUserId { get; set; }

    public User? DispensedByUser { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<PrescriptionDetail> Details { get; set; }
        = new List<PrescriptionDetail>();
}

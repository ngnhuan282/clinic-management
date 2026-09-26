namespace ClinicManagement.Data.Entities;

public class MedicalRecord
{
    public int MedicalRecordId { get; set; }

    public int AppointmentId { get; set; }

    public Appointment Appointment { get; set; } = null!;

    public int DoctorId { get; set; }

    public Doctor Doctor { get; set; } = null!;

    public int? PatientId { get; set; }

    public User? Patient { get; set; }

    public DateTime ExaminationDate { get; set; }

    public string Symptoms { get; set; } = string.Empty;

    public string? Conclusion { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<RecordDiagnosis> Diagnoses { get; set; }
        = new List<RecordDiagnosis>();
}

namespace ClinicManagement.Data.Entities;

public class Review
{
    public int ReviewId { get; set; }
    public int AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = null!;
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;
    public byte Rating { get; set; }
    public string? Comment { get; set; }
    public bool IsVisible { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

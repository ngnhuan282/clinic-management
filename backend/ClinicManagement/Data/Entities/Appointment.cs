namespace ClinicManagement.Data.Entities;

public class Appointment
{
    public int AppointmentId { get; set; }

    public int DoctorId { get; set; }

    public Doctor Doctor { get; set; } = null!;

    public int? PatientId { get; set; }

    public User? Patient { get; set; }
    public Guid? TimeSlotId { get; set; }
    public TimeSlot? TimeSlot { get; set; }

    public int? PatientProfileId { get; set; }
    public Patient? PatientProfile { get; set; }

    public int? PatientBookId { get; set; }
    public PatientBook? PatientBook { get; set; }

    public DateTime? BookVerifiedAt { get; set; }
    public DateTime? CheckedInAt { get; set; }

    public int? PatientBookId { get; set; }

    public PatientBook? PatientBook { get; set; }

    public string PatientName { get; set; } = string.Empty;

    public string PatientPhone { get; set; } = string.Empty;

    public DateTime AppointmentDate { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public string Reason { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime? BookVerifiedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public MedicalRecord? MedicalRecord { get; set; }
}

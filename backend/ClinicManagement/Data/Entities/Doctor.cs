namespace ClinicManagement.Data.Entities;

public class Doctor
{
    public int DoctorId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public int ExperienceYears { get; set; }

    public string? Biography { get; set; }

    public bool IsActive { get; set; } = true;

    public int DepartmentId { get; set; }

    public Department Department { get; set; } = null!;

    public int SpecializationId { get; set; }

    public Specialization Specialization { get; set; } = null!;

    public ICollection<Appointment> Appointments { get; set; }
        = new List<Appointment>();
}

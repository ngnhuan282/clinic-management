namespace ClinicManagement.Data.Entities;

public class Department
{
    public int DepartmentId { get; set; }
<<<<<<< HEAD

    public string DepartmentName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Doctor> Doctors { get; set; }
        = new List<Doctor>();
=======
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ICollection<Specialization> Specializations { get; set; } = [];
    public ICollection<Room> Rooms { get; set; } = [];
>>>>>>> origin/main
}

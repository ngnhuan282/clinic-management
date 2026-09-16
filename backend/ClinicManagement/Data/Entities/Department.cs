namespace ClinicManagement.Data.Entities;

public class Department
{
    public int DepartmentId { get; set; }

    public string DepartmentName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Doctor> Doctors { get; set; }
        = new List<Doctor>();
}

namespace ClinicManagement.Data.Entities;

public class MedicineCategory
{
    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public ICollection<Medicine> Medicines { get; set; }
        = new List<Medicine>();
}

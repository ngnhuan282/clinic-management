namespace ClinicManagement.Data.Entities;

public class Medicine
{
    public int MedicineId { get; set; }

    public string MedicineName { get; set; } = string.Empty;

    public int CategoryId { get; set; }

    public int? SupplierId { get; set; }

    public string Unit { get; set; } = string.Empty;

    public decimal UnitPrice { get; set; }

    public string? Description { get; set; }

    public MedicineCategory Category { get; set; } = null!;

    public Supplier? Supplier { get; set; }

    public ICollection<Inventory> Inventories { get; set; }
        = new List<Inventory>();
}

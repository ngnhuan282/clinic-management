namespace ClinicManagement.Data.Entities;

public class Supplier
{
    public int SupplierId { get; set; }

    public string SupplierName { get; set; } = string.Empty;

    public string? ContactInfo { get; set; }

    public string? Address { get; set; }

    public ICollection<Medicine> Medicines { get; set; }
        = new List<Medicine>();
}

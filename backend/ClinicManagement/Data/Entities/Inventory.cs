namespace ClinicManagement.Data.Entities;

public class Inventory
{
    public int InventoryId { get; set; }

    public int MedicineId { get; set; }

    public string BatchNumber { get; set; } = string.Empty;

    public int QuantityInStock { get; set; }

    public DateOnly ExpiryDate { get; set; }

    public Medicine Medicine { get; set; } = null!;
}

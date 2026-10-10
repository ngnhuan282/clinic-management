namespace ClinicManagement.Data.Entities;

public class DispenseDetail
{
    public int DispenseDetailId { get; set; }

    public int PrescriptionDetailId { get; set; }

    public PrescriptionDetail PrescriptionDetail { get; set; } = null!;

    public int InventoryId { get; set; }

    public Inventory Inventory { get; set; } = null!;

    public int QuantityDispensed { get; set; }
}

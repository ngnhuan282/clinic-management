namespace ClinicManagement.Data.Entities;

public class PrescriptionDetail
{
    public int PrescriptionDetailId { get; set; }

    public int PrescriptionId { get; set; }

    public Prescription Prescription { get; set; } = null!;

    public int MedicineId { get; set; }

    public Medicine Medicine { get; set; } = null!;

    public string Dosage { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public string Instructions { get; set; } = string.Empty;

    public ICollection<DispenseDetail> DispenseDetails { get; set; }
        = new List<DispenseDetail>();
}

namespace ClinicManagement.DTOs.Requests.Prescriptions;

public class SavePrescriptionDetailRequest
{
    public int MedicineId { get; set; }

    public string Dosage { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public string Instructions { get; set; } = string.Empty;
}

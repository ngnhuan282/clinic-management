namespace ClinicManagement.DTOs.Responses;

public class PrescriptionDetailResponse
{
    public int PrescriptionDetailId { get; set; }

    public int MedicineId { get; set; }

    public string MedicineCode { get; set; } = string.Empty;

    public string MedicineName { get; set; } = string.Empty;

    public string Unit { get; set; } = string.Empty;

    public decimal UnitPrice { get; set; }

    public string Dosage { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public string Instructions { get; set; } = string.Empty;

    public int AvailableQuantity { get; set; }

    public string StockStatus { get; set; } = string.Empty;

    public string StockMessage { get; set; } = string.Empty;

    public decimal LineAmount { get; set; }
}

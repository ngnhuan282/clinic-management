namespace ClinicManagement.DTOs.Responses;

public class PrescriptionMedicineOptionResponse
{
    public int MedicineId { get; set; }

    public string MedicineCode { get; set; } = string.Empty;

    public string MedicineName { get; set; } = string.Empty;

    public string Unit { get; set; } = string.Empty;

    public string CategoryName { get; set; } = string.Empty;

    public string? SupplierName { get; set; }

    public decimal UnitPrice { get; set; }

    public int AvailableQuantity { get; set; }

    public DateOnly? NearestExpiryDate { get; set; }

    public string StockStatus { get; set; } = string.Empty;
}

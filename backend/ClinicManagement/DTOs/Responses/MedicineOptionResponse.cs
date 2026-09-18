namespace ClinicManagement.DTOs.Responses;

public class MedicineOptionResponse
{
    public int MedicineId { get; set; }

    public string MedicineCode { get; set; } = string.Empty;

    public string MedicineName { get; set; } = string.Empty;

    public string Unit { get; set; } = string.Empty;

    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public int? SupplierId { get; set; }

    public string? SupplierName { get; set; }
}

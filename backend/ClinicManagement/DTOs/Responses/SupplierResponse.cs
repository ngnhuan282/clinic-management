namespace ClinicManagement.DTOs.Responses;

public class SupplierResponse
{
    public int SupplierId { get; set; }

    public string SupplierCode { get; set; } = string.Empty;

    public string SupplierName { get; set; } = string.Empty;

    public string? ContactInfo { get; set; }

    public string? Address { get; set; }

    public int MedicineCount { get; set; }

    public string UsageStatus { get; set; } = string.Empty;
}

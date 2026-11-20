namespace ClinicManagement.DTOs.Responses.Suppliers;

public class SupplierOptionResponse
{
    public int SupplierId { get; set; }

    public string SupplierName { get; set; } = string.Empty;

    public string? ContactInfo { get; set; }
}

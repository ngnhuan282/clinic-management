namespace ClinicManagement.DTOs.Responses;

public class SupplierSummaryResponse
{
    public int TotalSuppliers { get; set; }

    public int SuppliersInUse { get; set; }

    public int EmptySuppliers { get; set; }

    public int TotalLinkedMedicines { get; set; }
}

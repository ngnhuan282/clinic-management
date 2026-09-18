using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Mappings;

public static class SupplierMapping
{
    public static SupplierResponse ToResponse(this Supplier supplier)
    {
        var medicineCount = supplier.Medicines.Count;

        return new SupplierResponse
        {
            SupplierId = supplier.SupplierId,
            SupplierCode = $"NCC-{supplier.SupplierId:D3}",
            SupplierName = supplier.SupplierName,
            ContactInfo = supplier.ContactInfo,
            Address = supplier.Address,
            MedicineCount = medicineCount,
            UsageStatus = medicineCount > 0
                ? "InUse"
                : "Empty"
        };
    }
}

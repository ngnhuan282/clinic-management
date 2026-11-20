using ClinicManagement.DTOs.Responses.Medicines;
using ClinicManagement.Data.Entities;

namespace ClinicManagement.Mappings;

public static class MedicineCategoryMapping
{
    public static MedicineCategoryResponse ToResponse(
        this MedicineCategory category)
    {
        var medicineCount = category.Medicines.Count;

        return new MedicineCategoryResponse
        {
            CategoryId = category.CategoryId,
            CategoryCode = $"CAT-{category.CategoryId:D3}",
            CategoryName = category.CategoryName,
            MedicineCount = medicineCount,
            UsageStatus = medicineCount > 0
                ? "InUse"
                : "Empty"
        };
    }
}

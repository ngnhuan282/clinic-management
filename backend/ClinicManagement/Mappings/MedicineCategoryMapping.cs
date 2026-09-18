using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;

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

namespace ClinicManagement.DTOs.Responses;

public class MedicineCategorySummaryResponse
{
    public int TotalCategories { get; set; }

    public int CategoriesInUse { get; set; }

    public int EmptyCategories { get; set; }

    public int TotalMedicines { get; set; }
}

namespace ClinicManagement.DTOs.Responses;

public class MedicineCategoryResponse
{
    public int CategoryId { get; set; }

    public string CategoryCode { get; set; } = string.Empty;

    public string CategoryName { get; set; } = string.Empty;

    public int MedicineCount { get; set; }

    public string UsageStatus { get; set; } = string.Empty;
}

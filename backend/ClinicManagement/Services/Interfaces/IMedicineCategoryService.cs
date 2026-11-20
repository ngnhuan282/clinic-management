using ClinicManagement.DTOs.Requests.Medicines;
using ClinicManagement.DTOs.Responses.Medicines;
using ClinicManagement.DTOs.Responses.Shared;


namespace ClinicManagement.Services.Interfaces;

public interface IMedicineCategoryService
{
    Task<PagedResponse<MedicineCategoryResponse>> GetPagedAsync(
        MedicineCategoryFilterRequest request);

    Task<MedicineCategorySummaryResponse> GetSummaryAsync();

    Task<MedicineCategoryResponse> GetByIdAsync(int categoryId);

    Task<IReadOnlyList<MedicineCategoryOptionResponse>>
        GetOptionsAsync();

    Task<MedicineCategoryResponse> CreateAsync(
        CreateMedicineCategoryRequest request);

    Task<MedicineCategoryResponse> UpdateAsync(
        int categoryId,
        UpdateMedicineCategoryRequest request);

    Task DeleteAsync(int categoryId);
}

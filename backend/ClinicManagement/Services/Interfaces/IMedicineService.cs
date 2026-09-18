using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IMedicineService
{
    Task<PagedResponse<MedicineResponse>> GetPagedAsync(
        MedicineFilterRequest request
    );

    Task<MedicineSummaryResponse> GetSummaryAsync();

    Task<IReadOnlyList<MedicineOptionResponse>> GetOptionsAsync();

    Task<MedicineResponse> GetByIdAsync(int medicineId);

    Task<MedicineResponse> CreateAsync(
        CreateMedicineRequest request
    );

    Task<MedicineResponse> UpdateAsync(
        int medicineId,
        UpdateMedicineRequest request
    );

    Task DeleteAsync(int medicineId);
}

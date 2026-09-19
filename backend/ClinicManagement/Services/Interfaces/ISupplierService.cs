using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface ISupplierService
{
    Task<PagedResponse<SupplierResponse>> GetPagedAsync(
        SupplierFilterRequest request);

    Task<SupplierSummaryResponse> GetSummaryAsync();

    Task<SupplierResponse> GetByIdAsync(int supplierId);

    Task<IReadOnlyList<SupplierOptionResponse>> GetOptionsAsync();

    Task<SupplierResponse> CreateAsync(
        CreateSupplierRequest request);

    Task<SupplierResponse> UpdateAsync(
        int supplierId,
        UpdateSupplierRequest request);

    Task DeleteAsync(int supplierId);
}

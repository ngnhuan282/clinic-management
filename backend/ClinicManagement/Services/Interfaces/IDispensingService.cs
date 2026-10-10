using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IDispensingService
{
    Task<PagedResponse<DispensingListItemResponse>> GetPagedAsync(
        DispensingFilterRequest request
    );

    Task<DispensingSummaryResponse> GetSummaryAsync();

    Task<DispensingResponse> GetByIdAsync(int prescriptionId);

    Task<DispensingResponse> ConfirmAsync(int prescriptionId);
}

using ClinicManagement.DTOs.Requests.Dispensing;
using ClinicManagement.DTOs.Requests.StockReviews;
using ClinicManagement.DTOs.Responses.Dispensing;
using ClinicManagement.DTOs.Responses.Shared;


namespace ClinicManagement.Services.Interfaces;

public interface IDispensingService
{
    Task<PagedResponse<DispensingListItemResponse>> GetPagedAsync(
        DispensingFilterRequest request
    );

    Task<DispensingSummaryResponse> GetSummaryAsync();

    Task<DispensingResponse> GetByIdAsync(int prescriptionId);

    Task<DispensingResponse> ConfirmAsync(int prescriptionId);

    Task<DispensingResponse> RequestReviewAsync(int prescriptionId, CreateStockReviewRequest request);
    Task<DispensingResponse> RecheckReviewAsync(int prescriptionId, RecheckStockReviewRequest request);
}

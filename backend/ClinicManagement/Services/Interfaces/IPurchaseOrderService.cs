using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IPurchaseOrderService
{
    Task<PagedResponse<PurchaseOrderResponse>> GetPagedAsync(
        PurchaseOrderFilterRequest request
    );

    Task<PurchaseOrderSummaryResponse> GetSummaryAsync();

    Task<PurchaseOrderResponse> GetByIdAsync(int purchaseOrderId);

    Task<PurchaseOrderResponse> CreateAsync(
        CreatePurchaseOrderRequest request
    );

    Task<PurchaseOrderResponse> UpdateAsync(
        int purchaseOrderId,
        UpdatePurchaseOrderRequest request
    );

    Task<PurchaseOrderResponse> ReceiveAsync(int purchaseOrderId);

    Task<PurchaseOrderResponse> CancelAsync(int purchaseOrderId);
}

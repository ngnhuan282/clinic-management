using System.Data;
using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class PurchaseOrderService : IPurchaseOrderService
{
    private readonly IPurchaseOrderRepository _purchaseOrderRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly ICurrentUserService _currentUser;

    private static DateTime ClinicNow =>
        TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
            DateTime.UtcNow,
            "Asia/Ho_Chi_Minh"
        );

    public PurchaseOrderService(
        IPurchaseOrderRepository purchaseOrderRepository,
        ISupplierRepository supplierRepository,
        ICurrentUserService currentUser)
    {
        _purchaseOrderRepository = purchaseOrderRepository;
        _supplierRepository = supplierRepository;
        _currentUser = currentUser;
    }

    public async Task<PagedResponse<PurchaseOrderResponse>> GetPagedAsync(
        PurchaseOrderFilterRequest request)
    {
        var (items, totalItems) =
            await _purchaseOrderRepository.GetPagedAsync(request);

        return new PagedResponse<PurchaseOrderResponse>(
            items.Select(x => x.ToResponse()).ToList(),
            request.PageNumber,
            request.PageSize,
            totalItems
        );
    }

    public async Task<PurchaseOrderSummaryResponse> GetSummaryAsync()
    {
        var orders = await _purchaseOrderRepository.GetAllAsync();
        var now = ClinicNow;

        return new PurchaseOrderSummaryResponse
        {
            TotalOrders = orders.Count,
            DraftOrders = orders.Count(x =>
                x.Status == PurchaseOrderStatusConstants.Draft),
            ReceivedOrders = orders.Count(x =>
                x.Status == PurchaseOrderStatusConstants.Received),
            CancelledOrders = orders.Count(x =>
                x.Status == PurchaseOrderStatusConstants.Cancelled),
            ReceivedValueThisMonth = orders
                .Where(x =>
                    x.Status == PurchaseOrderStatusConstants.Received &&
                    x.ReceivedAt.HasValue &&
                    x.ReceivedAt.Value.Year == now.Year &&
                    x.ReceivedAt.Value.Month == now.Month)
                .Sum(x => x.TotalAmount)
        };
    }

    public async Task<PurchaseOrderResponse> GetByIdAsync(
        int purchaseOrderId)
    {
        var purchaseOrder = await GetRequiredAsync(purchaseOrderId);
        return purchaseOrder.ToResponse();
    }

    public async Task<PurchaseOrderResponse> CreateAsync(
        CreatePurchaseOrderRequest request)
    {
        await ValidateRequestAsync(request);

        var now = ClinicNow;
        var purchaseOrder = new PurchaseOrder
        {
            SupplierId = request.SupplierId,
            OrderDate = request.OrderDate == default
                ? now
                : request.OrderDate,
            Status = PurchaseOrderStatusConstants.Draft,
            Notes = NormalizeOptionalText(request.Notes),
            CreatedByUserId = _currentUser.GetRequiredUserId(),
            CreatedAt = now,
            UpdatedAt = now
        };

        ReplaceDetails(purchaseOrder, request.Details);

        await _purchaseOrderRepository.AddAsync(purchaseOrder);
        await _purchaseOrderRepository.SaveChangesAsync();

        return await GetByIdAsync(purchaseOrder.PurchaseOrderId);
    }

    public async Task<PurchaseOrderResponse> UpdateAsync(
        int purchaseOrderId,
        UpdatePurchaseOrderRequest request)
    {
        var purchaseOrder = await GetRequiredAsync(purchaseOrderId);
        EnsureDraft(purchaseOrder);
        await ValidateRequestAsync(request);

        purchaseOrder.SupplierId = request.SupplierId;
        purchaseOrder.OrderDate = request.OrderDate == default
            ? purchaseOrder.OrderDate
            : request.OrderDate;
        purchaseOrder.Notes = NormalizeOptionalText(request.Notes);
        purchaseOrder.UpdatedAt = ClinicNow;

        purchaseOrder.Details.Clear();
        ReplaceDetails(purchaseOrder, request.Details);

        await _purchaseOrderRepository.SaveChangesAsync();
        return await GetByIdAsync(purchaseOrderId);
    }

    public async Task<PurchaseOrderResponse> ReceiveAsync(
        int purchaseOrderId)
    {
        await using var transaction =
            await _purchaseOrderRepository.BeginTransactionAsync(
                IsolationLevel.Serializable
            );

        var purchaseOrder = await GetRequiredAsync(purchaseOrderId);
        EnsureDraft(purchaseOrder);

        var today = DateOnly.FromDateTime(ClinicNow);
        if (purchaseOrder.Details.Any(x => x.ExpiryDate < today))
        {
            throw new AppException(
                ErrorCode.PURCHASE_ORDER_EXPIRED_BATCH
            );
        }

        foreach (var detail in purchaseOrder.Details)
        {
            var inventory =
                await _purchaseOrderRepository.GetInventoryLotAsync(
                    detail.MedicineId,
                    detail.BatchNumber
                );

            if (inventory == null)
            {
                await _purchaseOrderRepository.AddInventoryAsync(
                    new Inventory
                    {
                        MedicineId = detail.MedicineId,
                        BatchNumber = detail.BatchNumber,
                        QuantityInStock = detail.Quantity,
                        ExpiryDate = detail.ExpiryDate
                    }
                );
                continue;
            }

            if (inventory.ExpiryDate != detail.ExpiryDate)
            {
                throw new AppException(
                    ErrorCode.INVENTORY_BATCH_EXPIRY_CONFLICT,
                    $"Số lô \"{detail.BatchNumber}\" đang có HSD " +
                    $"{inventory.ExpiryDate:dd/MM/yyyy}; phiếu nhập ghi HSD " +
                    $"{detail.ExpiryDate:dd/MM/yyyy}. Vui lòng đối chiếu lại."
                );
            }

            inventory.QuantityInStock += detail.Quantity;
        }

        var now = ClinicNow;
        purchaseOrder.Status = PurchaseOrderStatusConstants.Received;
        purchaseOrder.ReceivedByUserId =
            _currentUser.GetRequiredUserId();
        purchaseOrder.ReceivedAt = now;
        purchaseOrder.UpdatedAt = now;

        await _purchaseOrderRepository.SaveChangesAsync();
        await transaction.CommitAsync();

        return await GetByIdAsync(purchaseOrderId);
    }

    public async Task<PurchaseOrderResponse> CancelAsync(
        int purchaseOrderId)
    {
        var purchaseOrder = await GetRequiredAsync(purchaseOrderId);
        EnsureDraft(purchaseOrder);

        purchaseOrder.Status = PurchaseOrderStatusConstants.Cancelled;
        purchaseOrder.UpdatedAt = ClinicNow;

        await _purchaseOrderRepository.SaveChangesAsync();
        return await GetByIdAsync(purchaseOrderId);
    }

    private async Task ValidateRequestAsync(
        CreatePurchaseOrderRequest request)
    {
        if (!await _supplierRepository.ExistsAsync(request.SupplierId))
        {
            throw new AppException(ErrorCode.SUPPLIER_NOT_FOUND);
        }

        if (request.Details.Count == 0 || request.Details.Any(x =>
                x.MedicineId <= 0 ||
                x.Quantity <= 0 ||
                x.UnitPrice <= 0 ||
                string.IsNullOrWhiteSpace(x.BatchNumber) ||
                x.ExpiryDate == default))
        {
            throw new AppException(
                ErrorCode.PURCHASE_ORDER_INVALID_DETAILS
            );
        }

        var duplicateBatch = request.Details
            .GroupBy(x => new
            {
                x.MedicineId,
                BatchNumber = x.BatchNumber.Trim().ToUpperInvariant()
            })
            .Any(x => x.Count() > 1);

        if (duplicateBatch)
        {
            throw new AppException(
                ErrorCode.PURCHASE_ORDER_DUPLICATE_BATCH
            );
        }

        var medicineIds = request.Details
            .Select(x => x.MedicineId)
            .Distinct()
            .ToArray();
        var existingMedicineIds =
            await _purchaseOrderRepository.GetExistingMedicineIdsAsync(
                medicineIds
            );

        if (medicineIds.Any(x => !existingMedicineIds.Contains(x)))
        {
            throw new AppException(ErrorCode.MEDICINE_NOT_FOUND);
        }

        if (!await _purchaseOrderRepository
                .AreMedicinesFromSupplierAsync(
                    request.SupplierId,
                    medicineIds
                ))
        {
            throw new AppException(
                ErrorCode.PURCHASE_ORDER_SUPPLIER_MISMATCH
            );
        }

        var today = DateOnly.FromDateTime(ClinicNow);
        if (request.Details.Any(x => x.ExpiryDate < today))
        {
            throw new AppException(
                ErrorCode.PURCHASE_ORDER_EXPIRED_BATCH
            );
        }
    }

    private static void ReplaceDetails(
        PurchaseOrder purchaseOrder,
        IEnumerable<PurchaseOrderDetailRequest> requests)
    {
        foreach (var request in requests)
        {
            purchaseOrder.Details.Add(new PurchaseOrderDetail
            {
                MedicineId = request.MedicineId,
                Quantity = request.Quantity,
                UnitPrice = request.UnitPrice,
                BatchNumber = request.BatchNumber.Trim(),
                ExpiryDate = request.ExpiryDate
            });
        }

        purchaseOrder.TotalAmount = purchaseOrder.Details.Sum(x =>
            x.Quantity * x.UnitPrice);
    }

    private async Task<PurchaseOrder> GetRequiredAsync(
        int purchaseOrderId)
    {
        var purchaseOrder =
            await _purchaseOrderRepository.GetByIdAsync(purchaseOrderId);

        return purchaseOrder ?? throw new AppException(
            ErrorCode.PURCHASE_ORDER_NOT_FOUND
        );
    }

    private static void EnsureDraft(PurchaseOrder purchaseOrder)
    {
        if (purchaseOrder.Status != PurchaseOrderStatusConstants.Draft)
        {
            throw new AppException(
                ErrorCode.PURCHASE_ORDER_INVALID_STATUS
            );
        }
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}

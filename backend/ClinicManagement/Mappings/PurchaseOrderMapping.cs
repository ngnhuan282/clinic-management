using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Mappings;

public static class PurchaseOrderMapping
{
    public static PurchaseOrderResponse ToResponse(
        this PurchaseOrder purchaseOrder)
    {
        var details = purchaseOrder.Details
            .OrderBy(x => x.PurchaseOrderDetailId)
            .Select(x => new PurchaseOrderDetailResponse
            {
                PurchaseOrderDetailId = x.PurchaseOrderDetailId,
                MedicineId = x.MedicineId,
                MedicineCode = $"MED-{x.MedicineId:D5}",
                MedicineName = x.Medicine.MedicineName,
                Unit = x.Medicine.Unit,
                Quantity = x.Quantity,
                UnitPrice = x.UnitPrice,
                LineTotal = x.Quantity * x.UnitPrice,
                BatchNumber = x.BatchNumber,
                ExpiryDate = x.ExpiryDate
            })
            .ToList();

        return new PurchaseOrderResponse
        {
            PurchaseOrderId = purchaseOrder.PurchaseOrderId,
            PurchaseOrderCode =
                $"PNK-{purchaseOrder.OrderDate:yyyy}-{purchaseOrder.PurchaseOrderId:D4}",
            SupplierId = purchaseOrder.SupplierId,
            SupplierName = purchaseOrder.Supplier.SupplierName,
            OrderDate = purchaseOrder.OrderDate,
            TotalAmount = purchaseOrder.TotalAmount,
            Status = purchaseOrder.Status,
            Notes = purchaseOrder.Notes,
            ItemCount = details.Count,
            TotalQuantity = details.Sum(x => x.Quantity),
            CreatedByUserId = purchaseOrder.CreatedByUserId,
            CreatedByName = purchaseOrder.CreatedByUser.FullName,
            ReceivedByUserId = purchaseOrder.ReceivedByUserId,
            ReceivedByName = purchaseOrder.ReceivedByUser?.FullName,
            ReceivedAt = purchaseOrder.ReceivedAt,
            CreatedAt = purchaseOrder.CreatedAt,
            UpdatedAt = purchaseOrder.UpdatedAt,
            Details = details
        };
    }
}

using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Mappings;

public static class InventoryMapping
{
    public static InventoryResponse ToResponse(
        this Inventory inventory,
        DateOnly today)
    {
        var daysUntilExpiry =
            inventory.ExpiryDate.DayNumber - today.DayNumber;

        return new InventoryResponse
        {
            InventoryId = inventory.InventoryId,
            MedicineId = inventory.MedicineId,
            MedicineCode = $"MED-{inventory.MedicineId:D5}",
            MedicineName = inventory.Medicine.MedicineName,
            CategoryId = inventory.Medicine.CategoryId,
            CategoryName = inventory.Medicine.Category.CategoryName,
            SupplierId = inventory.Medicine.SupplierId,
            SupplierName = inventory.Medicine.Supplier?.SupplierName,
            Unit = inventory.Medicine.Unit,
            UnitPrice = inventory.Medicine.UnitPrice,
            Description = inventory.Medicine.Description,
            BatchNumber = inventory.BatchNumber,
            QuantityInStock = inventory.QuantityInStock,
            AvailableQuantity = inventory.ExpiryDate >= today
                ? Math.Max(0, inventory.QuantityInStock)
                : 0,
            StockLevel = GetStockLevel(inventory.QuantityInStock),
            ExpiryStatus = GetExpiryStatus(inventory.ExpiryDate, today),
            ExpiryDate = inventory.ExpiryDate,
            DaysUntilExpiry = daysUntilExpiry,
            StockStatus = GetStockStatus(
                inventory.QuantityInStock,
                inventory.ExpiryDate,
                today
            )
        };
    }

    public static string GetStockLevel(int quantityInStock) =>
        quantityInStock <= 0 ? "OutOfStock"
        : quantityInStock <= MedicineMapping.LowStockThreshold ? "LowStock"
        : "InStock";

    public static string GetExpiryStatus(DateOnly expiryDate, DateOnly today) =>
        expiryDate < today ? "Expired"
        : expiryDate <= today.AddDays(MedicineMapping.ExpiringSoonDays) ? "ExpiringSoon"
        : "Valid";

    public static string GetStockStatus(
        int quantityInStock,
        DateOnly expiryDate,
        DateOnly today)
    {
        if (quantityInStock <= 0)
        {
            return "OutOfStock";
        }

        if (expiryDate < today)
        {
            return "Expired";
        }

        if (quantityInStock <= MedicineMapping.LowStockThreshold)
        {
            return "LowStock";
        }

        if (expiryDate <= today.AddDays(
                MedicineMapping.ExpiringSoonDays))
        {
            return "ExpiringSoon";
        }

        return "InStock";
    }
}

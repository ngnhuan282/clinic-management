using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Mappings;

public static class InventoryMapping
{
    public static InventoryResponse ToResponse(
        this Inventory inventory,
        DateOnly today,
        int lowStockThreshold = MedicineMapping.LowStockThreshold,
        int expiringSoonDays = MedicineMapping.ExpiringSoonDays)
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
            StockLevel = GetStockLevel(inventory.QuantityInStock, lowStockThreshold),
            ExpiryStatus = GetExpiryStatus(inventory.ExpiryDate, today, expiringSoonDays),
            ExpiryDate = inventory.ExpiryDate,
            DaysUntilExpiry = daysUntilExpiry,
            StockStatus = GetStockStatus(
                inventory.QuantityInStock,
                inventory.ExpiryDate,
                today,
                lowStockThreshold,
                expiringSoonDays
            )
        };
    }

    public static string GetStockLevel(int quantityInStock, int lowStockThreshold = MedicineMapping.LowStockThreshold) =>
        quantityInStock <= 0 ? "OutOfStock"
        : quantityInStock <= lowStockThreshold ? "LowStock"
        : "InStock";

    public static string GetExpiryStatus(DateOnly expiryDate, DateOnly today, int expiringSoonDays = MedicineMapping.ExpiringSoonDays) =>
        expiryDate < today ? "Expired"
        : expiryDate <= today.AddDays(expiringSoonDays) ? "ExpiringSoon"
        : "Valid";

    public static string GetStockStatus(
        int quantityInStock,
        DateOnly expiryDate,
        DateOnly today,
        int lowStockThreshold = MedicineMapping.LowStockThreshold,
        int expiringSoonDays = MedicineMapping.ExpiringSoonDays)
    {
        if (quantityInStock <= 0)
        {
            return "OutOfStock";
        }

        if (expiryDate < today)
        {
            return "Expired";
        }

        if (quantityInStock <= lowStockThreshold)
        {
            return "LowStock";
        }

        if (expiryDate <= today.AddDays(expiringSoonDays))
        {
            return "ExpiringSoon";
        }

        return "InStock";
    }
}

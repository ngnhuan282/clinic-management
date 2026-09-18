using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Mappings;

public static class MedicineMapping
{
    public const int LowStockThreshold = 10;

    public const int ExpiringSoonDays = 30;

    public static MedicineResponse ToResponse(
        this Medicine medicine,
        DateOnly today)
    {
        var activeInventories = medicine.Inventories
            .Where(x => x.QuantityInStock > 0)
            .ToList();

        var totalQuantity = activeInventories
            .Sum(x => x.QuantityInStock);

        var nearestExpiryDate = activeInventories
            .OrderBy(x => x.ExpiryDate)
            .Select(x => (DateOnly?)x.ExpiryDate)
            .FirstOrDefault();

        return new MedicineResponse
        {
            MedicineId = medicine.MedicineId,
            MedicineCode = $"MED-{medicine.MedicineId:D5}",
            MedicineName = medicine.MedicineName,
            CategoryId = medicine.CategoryId,
            CategoryName = medicine.Category.CategoryName,
            SupplierId = medicine.SupplierId,
            SupplierName = medicine.Supplier?.SupplierName,
            Unit = medicine.Unit,
            UnitPrice = medicine.UnitPrice,
            Description = medicine.Description,
            TotalQuantityInStock = totalQuantity,
            NearestExpiryDate = nearestExpiryDate,
            StockStatus = GetStockStatus(
                totalQuantity,
                nearestExpiryDate,
                today
            )
        };
    }

    public static MedicineOptionResponse ToOptionResponse(
        this Medicine medicine)
    {
        return new MedicineOptionResponse
        {
            MedicineId = medicine.MedicineId,
            MedicineCode = $"MED-{medicine.MedicineId:D5}",
            MedicineName = medicine.MedicineName,
            Unit = medicine.Unit,
            CategoryId = medicine.CategoryId,
            CategoryName = medicine.Category.CategoryName,
            SupplierId = medicine.SupplierId,
            SupplierName = medicine.Supplier?.SupplierName
        };
    }

    public static string GetStockStatus(
        int totalQuantity,
        DateOnly? nearestExpiryDate,
        DateOnly today)
    {
        if (totalQuantity <= 0)
        {
            return "OutOfStock";
        }

        if (nearestExpiryDate.HasValue &&
            nearestExpiryDate.Value < today)
        {
            return "Expired";
        }

        if (totalQuantity <= LowStockThreshold)
        {
            return "LowStock";
        }

        if (nearestExpiryDate.HasValue &&
            nearestExpiryDate.Value <= today.AddDays(ExpiringSoonDays))
        {
            return "ExpiringSoon";
        }

        return "InStock";
    }
}

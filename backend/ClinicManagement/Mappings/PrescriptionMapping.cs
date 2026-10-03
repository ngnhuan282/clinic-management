using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Mappings;

public static class PrescriptionMapping
{
    public static PrescriptionResponse ToResponse(
        this Prescription prescription,
        DateOnly today)
    {
        var details = prescription.Details
            .OrderBy(x => x.Medicine.MedicineName)
            .Select(x => x.ToResponse(today))
            .ToList();

        return new PrescriptionResponse
        {
            PrescriptionId = prescription.PrescriptionId,
            MedicalRecordId = prescription.MedicalRecordId,
            AppointmentId = prescription.MedicalRecord.AppointmentId,
            PrescriptionCode = $"RX-{prescription.PrescriptionId:D5}",
            PrescriptionDate = prescription.PrescriptionDate,
            Status = prescription.Status,
            DispensedAt = prescription.DispensedAt,
            Notes = prescription.Notes,
            PatientName = prescription.MedicalRecord.Appointment.PatientName,
            PatientPhone = prescription.MedicalRecord.Appointment.PatientPhone,
            DoctorName = prescription.MedicalRecord.Doctor.FullName,
            Symptoms = prescription.MedicalRecord.Symptoms,
            Conclusion = prescription.MedicalRecord.Conclusion,
            TotalItems = details.Count,
            TotalQuantity = details.Sum(x => x.Quantity),
            EstimatedTotalAmount = details.Sum(x => x.LineAmount),
            StockWarningCount = details.Count(x =>
                x.StockStatus is "Insufficient" or "OutOfStock"),
            Details = details
        };
    }

    public static PrescriptionDetailResponse ToResponse(
        this PrescriptionDetail detail,
        DateOnly today)
    {
        var availableQuantity = GetAvailableQuantity(
            detail.Medicine,
            today
        );

        var stockStatus = GetDetailStockStatus(
            availableQuantity,
            detail.Quantity
        );

        return new PrescriptionDetailResponse
        {
            PrescriptionDetailId = detail.PrescriptionDetailId,
            MedicineId = detail.MedicineId,
            MedicineCode = $"MED-{detail.MedicineId:D5}",
            MedicineName = detail.Medicine.MedicineName,
            Unit = detail.Medicine.Unit,
            UnitPrice = detail.Medicine.UnitPrice,
            Dosage = detail.Dosage,
            Quantity = detail.Quantity,
            Instructions = detail.Instructions,
            AvailableQuantity = availableQuantity,
            StockStatus = stockStatus,
            StockMessage = GetStockMessage(
                stockStatus,
                availableQuantity,
                detail.Medicine.Unit
            ),
            LineAmount = detail.Quantity * detail.Medicine.UnitPrice
        };
    }

    public static PrescriptionMedicineOptionResponse ToPrescriptionOptionResponse(
        this Medicine medicine,
        DateOnly today)
    {
        var availableQuantity = GetAvailableQuantity(medicine, today);
        var nearestExpiryDate = GetNearestExpiryDate(medicine, today);

        return new PrescriptionMedicineOptionResponse
        {
            MedicineId = medicine.MedicineId,
            MedicineCode = $"MED-{medicine.MedicineId:D5}",
            MedicineName = medicine.MedicineName,
            Unit = medicine.Unit,
            CategoryName = medicine.Category.CategoryName,
            SupplierName = medicine.Supplier?.SupplierName,
            UnitPrice = medicine.UnitPrice,
            AvailableQuantity = availableQuantity,
            NearestExpiryDate = nearestExpiryDate,
            StockStatus = GetOptionStockStatus(availableQuantity)
        };
    }

    public static int GetAvailableQuantity(
        Medicine medicine,
        DateOnly today)
    {
        return medicine.Inventories
            .Where(x =>
                x.QuantityInStock > 0 &&
                x.ExpiryDate >= today)
            .Sum(x => x.QuantityInStock);
    }

    private static DateOnly? GetNearestExpiryDate(
        Medicine medicine,
        DateOnly today)
    {
        return medicine.Inventories
            .Where(x =>
                x.QuantityInStock > 0 &&
                x.ExpiryDate >= today)
            .OrderBy(x => x.ExpiryDate)
            .Select(x => (DateOnly?)x.ExpiryDate)
            .FirstOrDefault();
    }

    private static string GetOptionStockStatus(int availableQuantity)
    {
        if (availableQuantity <= 0)
        {
            return "OutOfStock";
        }

        if (availableQuantity <= MedicineMapping.LowStockThreshold)
        {
            return "LowStock";
        }

        return "Available";
    }

    private static string GetDetailStockStatus(
        int availableQuantity,
        int requestedQuantity)
    {
        if (availableQuantity <= 0)
        {
            return "OutOfStock";
        }

        if (availableQuantity < requestedQuantity)
        {
            return "Insufficient";
        }

        return "Available";
    }

    private static string GetStockMessage(
        string stockStatus,
        int availableQuantity,
        string unit)
    {
        return stockStatus switch
        {
            "OutOfStock" => "Hết tồn khả dụng",
            "Insufficient" => $"Chỉ còn {availableQuantity} {unit}",
            _ => "Đủ tồn khả dụng"
        };
    }
}

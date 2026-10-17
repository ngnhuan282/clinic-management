using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Mappings;

public static class DispensingMapping
{
    public static DispensingListItemResponse ToDispensingListItem(
        this Prescription prescription,
        Invoice? paidInvoice,
        DateOnly today)
    {
        return new DispensingListItemResponse
        {
            ShortageItems = prescription.Status == PrescriptionStatusConstants.Dispensed ? 0
                : prescription.Details.Count(x => x.Quantity > x.Medicine.Inventories
                    .Where(i => i.ExpiryDate >= today && i.QuantityInStock > 0).Sum(i => i.QuantityInStock)),
            ReviewStatus = GetReviewStatus(prescription),
            PrescriptionId = prescription.PrescriptionId,
            PrescriptionCode = GetPrescriptionCode(
                prescription.PrescriptionId
            ),
            AppointmentId = prescription.MedicalRecord.AppointmentId,
            PrescriptionDate = prescription.PrescriptionDate,
            PatientName = prescription.MedicalRecord.Appointment.PatientName,
            PatientPhone = prescription.MedicalRecord.Appointment.PatientPhone,
            DoctorName = prescription.MedicalRecord.Doctor.FullName,
            TotalItems = prescription.Details.Count,
            TotalQuantity = prescription.Details.Sum(x => x.Quantity),
            EstimatedTotalAmount = prescription.Details.Sum(x =>
                x.Quantity * x.Medicine.UnitPrice
            ),
            PrescriptionStatus = prescription.Status,
            WorkflowStatus = GetWorkflowStatus(
                prescription.Status,
                paidInvoice?.Status == "Paid",
                prescription.Details.All(x => x.Quantity <= x.Medicine.Inventories
                    .Where(i => i.ExpiryDate >= today && i.QuantityInStock > 0).Sum(i => i.QuantityInStock)),
                prescription.StockReviews.Any(x => x.Status == "Pending")
            ),
            InvoiceId = paidInvoice?.Id,
            PaymentStatus = paidInvoice?.Status ?? "Unpaid",
            DispensedAt = prescription.DispensedAt
        };
    }

    public static DispensingResponse ToDispensingResponse(
        this Prescription prescription,
        Invoice? paidInvoice,
        DateOnly today)
    {
        var medicines = prescription.Details
            .OrderBy(x => x.Medicine.MedicineName)
            .Select(x => x.ToDispensingMedicine(
                today,
                prescription.Status == PrescriptionStatusConstants.Dispensed
            ))
            .ToList();
        var hasSufficientStock = medicines.All(x => x.IsFulfillable);
        var isPaid = paidInvoice?.Status == "Paid";
        var hasPendingReview = prescription.StockReviews.Any(x => x.Status == "Pending");

        return new DispensingResponse
        {
            UpdatedAt = DateTime.SpecifyKind(prescription.UpdatedAt, DateTimeKind.Utc),
            ReviewStatus = GetReviewStatus(prescription),
            CanRequestReview = prescription.Status == PrescriptionStatusConstants.Issued
                && !hasSufficientStock && !hasPendingReview,
            Reviews = prescription.StockReviews.OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.PrescriptionStockReviewId).Select(x => x.ToStockReviewResponse()).ToList(),
            PrescriptionId = prescription.PrescriptionId,
            PrescriptionCode = GetPrescriptionCode(
                prescription.PrescriptionId
            ),
            AppointmentId = prescription.MedicalRecord.AppointmentId,
            MedicalRecordId = prescription.MedicalRecordId,
            PrescriptionDate = prescription.PrescriptionDate,
            PrescriptionStatus = prescription.Status,
            WorkflowStatus = GetWorkflowStatus(
                prescription.Status,
                isPaid, hasSufficientStock, hasPendingReview
            ),
            PatientName = prescription.MedicalRecord.Appointment.PatientName,
            PatientPhone = prescription.MedicalRecord.Appointment.PatientPhone,
            DoctorName = prescription.MedicalRecord.Doctor.FullName,
            Notes = prescription.Notes,
            InvoiceId = paidInvoice?.Id,
            BillingStage = paidInvoice?.BillingStage,
            PaymentStatus = paidInvoice?.Status ?? "Unpaid",
            HasSufficientStock = hasSufficientStock,
            CanDispense =
                prescription.Status == PrescriptionStatusConstants.Issued &&
                isPaid &&
                hasSufficientStock && !hasPendingReview,
            DispensedByUserId = prescription.DispensedByUserId,
            DispensedByName = prescription.DispensedByUser?.FullName,
            DispensedAt = prescription.DispensedAt,
            Medicines = medicines
        };
    }

    private static DispensingMedicineResponse ToDispensingMedicine(
        this PrescriptionDetail detail,
        DateOnly today,
        bool useActualAllocations)
    {
        var validLots = detail.Medicine.Inventories
            .Where(x =>
                x.QuantityInStock > 0 &&
                x.ExpiryDate >= today
            )
            .OrderBy(x => x.ExpiryDate)
            .ThenBy(x => x.InventoryId)
            .ToList();

        var quantityAvailable = validLots.Sum(x => x.QuantityInStock);
        IReadOnlyList<DispensingLotAllocationResponse> allocations =
            useActualAllocations
                ? BuildActualAllocations(detail)
                : BuildSuggestedAllocations(detail.Quantity, validLots);

        return new DispensingMedicineResponse
        {
            PrescriptionDetailId = detail.PrescriptionDetailId,
            MedicineId = detail.MedicineId,
            MedicineCode = $"MED-{detail.MedicineId:D5}",
            MedicineName = detail.Medicine.MedicineName,
            Unit = detail.Medicine.Unit,
            Dosage = detail.Dosage,
            Instructions = detail.Instructions,
            QuantityPrescribed = detail.Quantity,
            QuantityAvailable = quantityAvailable,
            IsFulfillable = useActualAllocations
                ? allocations.Sum(x => x.QuantityAllocated) == detail.Quantity
                : quantityAvailable >= detail.Quantity,
            Allocations = allocations
        };
    }

    private static IReadOnlyList<DispensingLotAllocationResponse>
        BuildSuggestedAllocations(
            int quantityRequired,
            IReadOnlyList<Inventory> lots)
    {
        var remaining = quantityRequired;
        var allocations = new List<DispensingLotAllocationResponse>();

        foreach (var lot in lots)
        {
            if (remaining == 0)
            {
                break;
            }

            var quantity = Math.Min(remaining, lot.QuantityInStock);
            allocations.Add(ToAllocation(lot, quantity));
            remaining -= quantity;
        }

        return allocations;
    }

    private static IReadOnlyList<DispensingLotAllocationResponse>
        BuildActualAllocations(PrescriptionDetail detail)
    {
        return detail.DispenseDetails
            .OrderBy(x => x.Inventory.ExpiryDate)
            .ThenBy(x => x.InventoryId)
            .Select(x => ToAllocation(
                x.Inventory,
                x.QuantityDispensed
            ))
            .ToList();
    }

    private static DispensingLotAllocationResponse ToAllocation(
        Inventory lot,
        int quantity)
    {
        return new DispensingLotAllocationResponse
        {
            InventoryId = lot.InventoryId,
            BatchNumber = lot.BatchNumber,
            ExpiryDate = lot.ExpiryDate,
            QuantityAvailable = lot.QuantityInStock,
            QuantityAllocated = quantity
        };
    }

    private static string GetWorkflowStatus(
        string prescriptionStatus,
        bool isPaid, bool hasSufficientStock, bool hasPendingReview)
    {
        if (prescriptionStatus == PrescriptionStatusConstants.Dispensed)
        {
            return "Dispensed";
        }

        if (!hasSufficientStock || hasPendingReview) return "NeedsReview";
        return isPaid ? "Ready" : "AwaitingPayment";
    }

    private static string GetReviewStatus(Prescription prescription) =>
        prescription.StockReviews.Any(x => x.Status == "Pending") ? "Pending"
            : prescription.StockReviews.Count > 0 ? "Resolved" : "NotRequested";

    private static string GetPrescriptionCode(int prescriptionId)
    {
        return $"RX-{prescriptionId:D5}";
    }
}

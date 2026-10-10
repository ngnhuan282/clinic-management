namespace ClinicManagement.DTOs.Responses;

public class DispensingListItemResponse
{
    public int PrescriptionId { get; set; }

    public string PrescriptionCode { get; set; } = string.Empty;

    public int AppointmentId { get; set; }

    public DateTime PrescriptionDate { get; set; }

    public string PatientName { get; set; } = string.Empty;

    public string PatientPhone { get; set; } = string.Empty;

    public string DoctorName { get; set; } = string.Empty;

    public int TotalItems { get; set; }

    public int TotalQuantity { get; set; }

    public decimal EstimatedTotalAmount { get; set; }

    public string PrescriptionStatus { get; set; } = string.Empty;

    public string WorkflowStatus { get; set; } = string.Empty;

    public int? InvoiceId { get; set; }

    public string PaymentStatus { get; set; } = string.Empty;

    public DateTime? DispensedAt { get; set; }
}

public class DispensingLotAllocationResponse
{
    public int InventoryId { get; set; }

    public string BatchNumber { get; set; } = string.Empty;

    public DateOnly ExpiryDate { get; set; }

    public int QuantityAvailable { get; set; }

    public int QuantityAllocated { get; set; }
}

public class DispensingMedicineResponse
{
    public int PrescriptionDetailId { get; set; }

    public int MedicineId { get; set; }

    public string MedicineCode { get; set; } = string.Empty;

    public string MedicineName { get; set; } = string.Empty;

    public string Unit { get; set; } = string.Empty;

    public string Dosage { get; set; } = string.Empty;

    public string Instructions { get; set; } = string.Empty;

    public int QuantityPrescribed { get; set; }

    public int QuantityAvailable { get; set; }

    public bool IsFulfillable { get; set; }

    public IReadOnlyList<DispensingLotAllocationResponse> Allocations { get; set; }
        = [];
}

public class DispensingResponse
{
    public int PrescriptionId { get; set; }

    public string PrescriptionCode { get; set; } = string.Empty;

    public int AppointmentId { get; set; }

    public int MedicalRecordId { get; set; }

    public DateTime PrescriptionDate { get; set; }

    public string PrescriptionStatus { get; set; } = string.Empty;

    public string WorkflowStatus { get; set; } = string.Empty;

    public string PatientName { get; set; } = string.Empty;

    public string PatientPhone { get; set; } = string.Empty;

    public string DoctorName { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public int? InvoiceId { get; set; }

    public string? BillingStage { get; set; }

    public string PaymentStatus { get; set; } = string.Empty;

    public bool HasSufficientStock { get; set; }

    public bool CanDispense { get; set; }

    public int? DispensedByUserId { get; set; }

    public string? DispensedByName { get; set; }

    public DateTime? DispensedAt { get; set; }

    public IReadOnlyList<DispensingMedicineResponse> Medicines { get; set; }
        = [];
}

public class DispensingSummaryResponse
{
    public int AwaitingPayment { get; set; }

    public int ReadyToDispense { get; set; }

    public int DispensedToday { get; set; }
}

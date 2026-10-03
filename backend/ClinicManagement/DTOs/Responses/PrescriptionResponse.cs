namespace ClinicManagement.DTOs.Responses;

public class PrescriptionResponse
{
    public int PrescriptionId { get; set; }

    public int MedicalRecordId { get; set; }

    public int AppointmentId { get; set; }

    public string PrescriptionCode { get; set; } = string.Empty;

    public DateTime PrescriptionDate { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime? DispensedAt { get; set; }

    public string? Notes { get; set; }

    public string PatientName { get; set; } = string.Empty;

    public string PatientPhone { get; set; } = string.Empty;

    public string DoctorName { get; set; } = string.Empty;

    public string Symptoms { get; set; } = string.Empty;

    public string? Conclusion { get; set; }

    public int TotalItems { get; set; }

    public int TotalQuantity { get; set; }

    public decimal EstimatedTotalAmount { get; set; }

    public int StockWarningCount { get; set; }

    public IReadOnlyList<PrescriptionDetailResponse> Details { get; set; }
        = [];
}

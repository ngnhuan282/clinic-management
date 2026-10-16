namespace ClinicManagement.DTOs.Responses;

public class MedicalHistorySummaryResponse
{
    public int PatientId { get; set; }
    public string PatientCode { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string? PatientBookNumber { get; set; }
    public int TotalCompletedVisits { get; set; }
    public int TotalDoctors { get; set; }
    public DateTime? LatestExaminationDate { get; set; }
    public int? LatestMedicalRecordId { get; set; }
}

public class MedicalHistoryListItemResponse
{
    public int MedicalRecordId { get; set; }
    public int AppointmentId { get; set; }
    public DateTime ExaminationDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public IReadOnlyList<RecordDiagnosisResponse> Diagnoses { get; set; } = [];
    public string? PrescriptionStatus { get; set; }
    public int PrescriptionItemCount { get; set; }
    public IReadOnlyList<string> MedicineNames { get; set; } = [];
}

public class PatientMedicalHistorySummaryResponse
{
    public string PatientCode { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public int TotalCompletedVisits { get; set; }
    public int TotalPrescriptions { get; set; }
    public DateTime? LatestExaminationDate { get; set; }
    public int? LatestMedicalRecordId { get; set; }
}

public class MedicalHistoryDetailResponse
{
    public string PatientCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public MedicalRecordResponse Record { get; set; } = new();
    public MedicalHistoryPrescriptionResponse? Prescription { get; set; }
    public PatientMedicineBillingResponse? MedicineBilling { get; set; }
}

public class MedicalHistoryPrescriptionResponse
{
    public string PrescriptionCode { get; set; } = string.Empty;
    public DateTime PrescriptionDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? DispensedAt { get; set; }
    public string? Notes { get; set; }
    public IReadOnlyList<MedicalHistoryMedicineResponse> Details { get; set; } = [];
}

public class MedicalHistoryMedicineResponse
{
    public int PrescriptionDetailId { get; set; }
    public string MedicineCode { get; set; } = string.Empty;
    public string MedicineName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Dosage { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
}

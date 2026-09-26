namespace ClinicManagement.Data.Entities;

public class RecordDiagnosis
{
    public int RecordDiagnosisId { get; set; }

    public int MedicalRecordId { get; set; }

    public MedicalRecord MedicalRecord { get; set; } = null!;

    public int DiseaseId { get; set; }

    public Disease Disease { get; set; } = null!;

    public bool IsPrimary { get; set; }

    public string? Note { get; set; }
}

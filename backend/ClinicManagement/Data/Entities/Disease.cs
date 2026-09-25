namespace ClinicManagement.Data.Entities;

public class Disease
{
    public int DiseaseId { get; set; }

    public string DiseaseCode { get; set; } = string.Empty;

    public string DiseaseName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public ICollection<RecordDiagnosis> RecordDiagnoses { get; set; }
        = new List<RecordDiagnosis>();
}

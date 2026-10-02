namespace ClinicManagement.DTOs.Requests;

public class CreatePrescriptionRequest
{
    public int MedicalRecordId { get; set; }

    public string? Notes { get; set; }

    public IReadOnlyList<SavePrescriptionDetailRequest> Details { get; set; }
        = [];
}

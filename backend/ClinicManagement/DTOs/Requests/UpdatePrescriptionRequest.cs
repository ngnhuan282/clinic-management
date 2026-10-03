namespace ClinicManagement.DTOs.Requests;

public class UpdatePrescriptionRequest
{
    public string? Notes { get; set; }

    public IReadOnlyList<SavePrescriptionDetailRequest> Details { get; set; }
        = [];
}

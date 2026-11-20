namespace ClinicManagement.DTOs.Requests.Prescriptions;

public class UpdatePrescriptionRequest
{
    public string? Notes { get; set; }

    public IReadOnlyList<SavePrescriptionDetailRequest> Details { get; set; }
        = [];
}

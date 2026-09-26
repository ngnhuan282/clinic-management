namespace ClinicManagement.DTOs.LabTests
{
    public class CreateLabTestDto
    {
        public int PatientId { get; set; }
        public int LabTestTypeId { get; set; }
        public string? ClinicalDiagnosis { get; set; }
    }
}
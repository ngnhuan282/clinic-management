namespace ClinicManagement.DTOs.LabTests
{
    public class CreateLabTestDto
    {
        public int? AppointmentId { get; set; }
        public int PatientId { get; set; }
        public int LabTestTypeId { get; set; }
        public string? ClinicalDiagnosis { get; set; }
    }
}
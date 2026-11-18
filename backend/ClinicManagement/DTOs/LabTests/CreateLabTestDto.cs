namespace ClinicManagement.DTOs.LabTests
{
    public class CreateLabTestDto
    {
        public int? AppointmentId { get; set; }
        public int? MedicalRecordId { get; set; }
        public int? PatientId { get; set; }          // Có thể là UserId hoặc PatientId tùy luồng
        public int? PatientProfileId { get; set; }   // Hồ sơ trong bảng Patients (hỗ trợ cả khi UserId == null)
        public string? WalkInPatientName { get; set; }
        public string? WalkInPatientPhone { get; set; }
        public int LabTestTypeId { get; set; }
        public string? ClinicalDiagnosis { get; set; }
    }
}
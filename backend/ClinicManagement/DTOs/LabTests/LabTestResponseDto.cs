using ClinicManagement.DTOs.LabTestResults; // Nếu Result dùng LabTestResultResponseDto

namespace ClinicManagement.DTOs.LabTests
{
    public class LabTestResponseDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public string LabTestTypeName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? ClinicalDiagnosis { get; set; }
        public DateTime CreatedAt { get; set; }
        public decimal Price { get; set; } 
        // Property cho kết quả xét nghiệm
        public LabTestResultResponseDto? Result { get; set; }
    }
}
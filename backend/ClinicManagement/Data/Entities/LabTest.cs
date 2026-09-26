using System;

namespace ClinicManagement.Data.Entities
{
    public class LabTest
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public int LabTestTypeId { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Completed, Cancelled
        public string? ClinicalDiagnosis { get; set; } // Chẩn đoán lâm sàng của bác sĩ
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation properties
        public LabTestType? LabTestType { get; set; }
        public LabTestResult? LabTestResult { get; set; }
    }
}
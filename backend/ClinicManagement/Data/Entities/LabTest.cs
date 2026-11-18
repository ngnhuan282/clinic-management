using System;

namespace ClinicManagement.Data.Entities
{
    public class LabTest
    {
        public int Id { get; set; }
        public int? AppointmentId { get; set; }
        public int? MedicalRecordId { get; set; }
        public int PatientId { get; set; }
        public int? PatientProfileId { get; set; } // Tuỳ chọn nếu muốn lưu rõ ID hồ sơ Patients
        public int DoctorId { get; set; }
        public int LabTestTypeId { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, InProgress, Completed, Cancelled
        public string? ClinicalDiagnosis { get; set; }
        public int? ReceivedByTechnicianId { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Appointment? Appointment { get; set; }
        public MedicalRecord? MedicalRecord { get; set; }
        public LabTestType? LabTestType { get; set; }
        public LabTestResult? LabTestResult { get; set; }
    }
}
using System;
using ClinicManagement.DTOs.LabTestResults;

namespace ClinicManagement.DTOs.LabTests
{
    public class LabTestResponseDto
    {
        public int Id { get; set; }
        public int? AppointmentId { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string PatientPhone { get; set; } = string.Empty;
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string LabTestTypeName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = "Unpaid"; // "Unpaid", "PartiallyPaid", "Paid"
        public string? ClinicalDiagnosis { get; set; }
        public int? ReceivedByTechnicianId { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public decimal Price { get; set; }

        public LabTestResultResponseDto? Result { get; set; }
    }
}
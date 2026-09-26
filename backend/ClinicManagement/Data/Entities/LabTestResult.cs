using System;

namespace ClinicManagement.Data.Entities
{
    public class LabTestResult
    {
        public int Id { get; set; }
        public int LabTestId { get; set; }
        public int TechnicianId { get; set; }
        public string ResultSummary { get; set; } = string.Empty; // Kết quả chỉ số/chi tiết
        public string? Note { get; set; }
        public string? FileUrl { get; set; }
        public DateTime PerformedAt { get; set; } = DateTime.Now;

        public LabTest? LabTest { get; set; }
    }
}
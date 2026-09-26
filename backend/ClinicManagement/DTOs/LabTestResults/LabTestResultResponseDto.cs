namespace ClinicManagement.DTOs.LabTestResults
{
    public class LabTestResultResponseDto
    {
        public int Id { get; set; }
        public string? ResultText { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TechnicianId { get; set; } // <--- Thêm
        public string? ResultSummary { get; set; } // <--- Thêm
        public string? Note { get; set; } // <--- Thêm
        public string? FileUrl { get; set; } // <--- Thêm
        public DateTime PerformedAt { get; set; } // <--- Thêm
        // Thêm các thuộc tính khác tùy theo Model của bạn
    }
}
namespace ClinicManagement.DTOs.LabTestResults
{
    public class CreateLabTestResultDto
    {
        public int LabTestId { get; set; }
        public string ResultSummary { get; set; } = string.Empty;
        public string? Note { get; set; }
        public string? FileUrl { get; set; }
    }
}
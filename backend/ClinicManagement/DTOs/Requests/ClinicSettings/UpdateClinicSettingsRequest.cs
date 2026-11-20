using System.Text.Json.Serialization;

namespace ClinicManagement.DTOs.Requests.ClinicSettings;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class UpdateClinicSettingsRequest
{
    public string? ClinicName { get; set; }
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? WorkingHours { get; set; }
    public string? PrimaryLocationName { get; set; }
    public string? PrimaryLocationAddress { get; set; }
    public string? SecondaryLocationName { get; set; }
    public string? SecondaryLocationAddress { get; set; }
    public decimal? DefaultExaminationFee { get; set; }
    public decimal? PatientBookFee { get; set; }
    public int? DefaultSlotDurationMinutes { get; set; }
    public int? DefaultMaxPatientsPerSlot { get; set; }
    public int? LowStockThreshold { get; set; }
    public int? NearExpiryDays { get; set; }
}

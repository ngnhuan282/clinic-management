namespace ClinicManagement.DTOs.Responses.ClinicSettings;

public sealed record ClinicLocationDto(string Name, string Address);

public sealed record PublicClinicSettingsResponse(
    string ClinicName,
    string Tagline,
    string Description,
    string Phone,
    string Email,
    string WorkingHours,
    IReadOnlyList<ClinicLocationDto> Locations,
    decimal DefaultExaminationFee,
    decimal PatientBookFee,
    int DefaultSlotDurationMinutes);

public sealed record ClinicSettingsResponse(
    int ClinicSettingId,
    string ClinicName,
    string Tagline,
    string Description,
    string Phone,
    string Email,
    string WorkingHours,
    string PrimaryLocationName,
    string PrimaryLocationAddress,
    string? SecondaryLocationName,
    string? SecondaryLocationAddress,
    decimal DefaultExaminationFee,
    decimal PatientBookFee,
    int DefaultSlotDurationMinutes,
    int DefaultMaxPatientsPerSlot,
    int LowStockThreshold,
    int NearExpiryDays,
    DateTime UpdatedAt,
    int? UpdatedByUserId,
    string? UpdatedByFullName);

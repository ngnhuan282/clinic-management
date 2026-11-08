using System.Text.Json;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Helpers;

public static class PublicSpecialtyContent
{
    private static readonly IReadOnlyDictionary<string, SpecialtyEntry> Entries = Load();

    public static SpecialtyInformation? ForCode(string code) =>
        Entries.TryGetValue(code, out var entry)
            ? new(entry.Overview, entry.FocusAreas, entry.Preparation, entry.SourceUrl)
            : null;

    private static IReadOnlyDictionary<string, SpecialtyEntry> Load()
    {
        using var stream = typeof(PublicSpecialtyContent).Assembly.GetManifestResourceStream(
            "ClinicManagement.Data.Content.specialties.vi.json")
            ?? throw new InvalidOperationException("Missing Vietnamese specialty content resource.");
        return (JsonSerializer.Deserialize<List<SpecialtyEntry>>(stream,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [])
            .ToDictionary(entry => entry.Code, StringComparer.OrdinalIgnoreCase);
    }

    private sealed record SpecialtyEntry(string Code, string Overview, string[] FocusAreas,
        string[] Preparation, string? SourceUrl);
}

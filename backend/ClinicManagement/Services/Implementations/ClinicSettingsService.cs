using System.Data;
using System.Net.Mail;
using System.Text.Json;
using System.Text.Json.Serialization;
using ClinicManagement.DTOs.Requests.ClinicSettings;
using ClinicManagement.DTOs.Responses.ClinicSettings;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Exceptions;
using ClinicManagement.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class ClinicSettingsService(ApplicationDbContext db, ICurrentUserService currentUser)
{
    public static async Task<ClinicSetting> ReadSnapshotSafeAsync(
        ApplicationDbContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await context.ClinicSettings.AsNoTracking()
                .OrderBy(x => x.ClinicSettingId)
                .FirstOrDefaultAsync(cancellationToken) ?? ClinicSetting.CreateSeed();
        }
        catch (SqlException ex) when (ex.Number == 208)
        {
            return ClinicSetting.CreateSeed();
        }
    }

    public Task<ClinicSetting> GetSnapshotAsync(CancellationToken cancellationToken = default) =>
        ReadSnapshotSafeAsync(db, cancellationToken);

    public async Task<PublicClinicSettingsResponse> GetPublicAsync(CancellationToken cancellationToken = default)
    {
        var setting = await GetSnapshotAsync(cancellationToken);
        var locations = new List<ClinicLocationDto>
        {
            new(setting.PrimaryLocationName, setting.PrimaryLocationAddress)
        };
        if (!string.IsNullOrWhiteSpace(setting.SecondaryLocationName)
            && !string.IsNullOrWhiteSpace(setting.SecondaryLocationAddress))
        {
            locations.Add(new(setting.SecondaryLocationName, setting.SecondaryLocationAddress));
        }

        return new PublicClinicSettingsResponse(
            setting.ClinicName,
            setting.Tagline,
            setting.Description,
            setting.Phone,
            setting.Email,
            setting.WorkingHours,
            locations,
            setting.DefaultExaminationFee,
            setting.PatientBookFee,
            setting.DefaultSlotDurationMinutes);
    }

    public async Task<ClinicSettingsResponse> GetAdminAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var setting = await db.ClinicSettings.AsNoTracking()
                .Include(x => x.UpdatedByUser)
                .OrderBy(x => x.ClinicSettingId)
                .FirstOrDefaultAsync(cancellationToken) ?? ClinicSetting.CreateSeed();

            return MapAdmin(setting, setting.UpdatedByUser?.FullName);
        }
        catch (SqlException ex) when (ex.Number == 208)
        {
            return MapAdmin(ClinicSetting.CreateSeed(), null);
        }
    }

    public async Task<ClinicSettingsResponse> UpdateAsync(
        UpdateClinicSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var actorUserId = currentUser.GetRequiredUserId();

        var clinicName = RequireText(request.ClinicName, 150);
        var tagline = RequireText(request.Tagline, 200);
        var description = RequireText(request.Description, 600);
        var phone = RequirePhone(request.Phone);
        var email = RequireEmail(request.Email);
        var workingHours = RequireText(request.WorkingHours, 150);
        var primaryName = RequireText(request.PrimaryLocationName, 150);
        var primaryAddress = RequireText(request.PrimaryLocationAddress, 255);
        var secondaryName = OptionalText(request.SecondaryLocationName, 150);
        var secondaryAddress = OptionalText(request.SecondaryLocationAddress, 255);

        if ((secondaryName is null) != (secondaryAddress is null))
            throw new AppException(ErrorCode.INVALID_REQUEST, "Vui lòng nhập đầy đủ cả tên và địa chỉ cơ sở phụ hoặc để trống cả hai.");

        var examFee = request.DefaultExaminationFee ?? throw new AppException(ErrorCode.INVALID_REQUEST);
        var bookFee = request.PatientBookFee ?? throw new AppException(ErrorCode.INVALID_REQUEST);
        var slotMinutes = request.DefaultSlotDurationMinutes ?? throw new AppException(ErrorCode.INVALID_REQUEST);
        var slotCapacity = request.DefaultMaxPatientsPerSlot ?? throw new AppException(ErrorCode.INVALID_REQUEST);
        var lowStock = request.LowStockThreshold ?? throw new AppException(ErrorCode.INVALID_REQUEST);
        var nearExpiry = request.NearExpiryDays ?? throw new AppException(ErrorCode.INVALID_REQUEST);

        if (examFee is <= 0m or > 100_000_000m
            || bookFee is <= 0m or > 10_000_000m
            || slotMinutes is not (15 or 20 or 30)
            || slotCapacity is < 1 or > 20
            || lowStock is < 1 or > 10_000
            || nearExpiry is < 1 or > 365)
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        try
        {
            _ = await db.ClinicSettings.AsNoTracking().AnyAsync(cancellationToken);
        }
        catch (SqlException ex) when (ex.Number == 208)
        {
            await db.Database.MigrateAsync(cancellationToken);
        }

        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var entity = await db.ClinicSettings
            .OrderBy(x => x.ClinicSettingId)
            .FirstOrDefaultAsync(cancellationToken);

        var beforeJson = entity is null ? null : SerializeAudit(entity);
        var now = DateTime.UtcNow;

        if (entity is null)
        {
            entity = new ClinicSetting();
            db.ClinicSettings.Add(entity);
        }

        entity.ClinicName = clinicName;
        entity.Tagline = tagline;
        entity.Description = description;
        entity.Phone = phone;
        entity.Email = email;
        entity.WorkingHours = workingHours;
        entity.PrimaryLocationName = primaryName;
        entity.PrimaryLocationAddress = primaryAddress;
        entity.SecondaryLocationName = secondaryName;
        entity.SecondaryLocationAddress = secondaryAddress;
        entity.DefaultExaminationFee = Math.Round(examFee, 2);
        entity.PatientBookFee = Math.Round(bookFee, 2);
        entity.DefaultSlotDurationMinutes = slotMinutes;
        entity.DefaultMaxPatientsPerSlot = slotCapacity;
        entity.LowStockThreshold = lowStock;
        entity.NearExpiryDays = nearExpiry;
        entity.UpdatedAt = now;
        entity.UpdatedByUserId = actorUserId;

        await db.SaveChangesAsync(cancellationToken);

        db.RbacAudits.Add(new RbacAudit
        {
            ActorUserId = actorUserId,
            Action = "clinic.settings",
            EntityType = "ClinicSetting",
            EntityId = entity.ClinicSettingId,
            BeforeJson = beforeJson,
            AfterJson = SerializeAudit(entity),
            CreatedAt = now
        });

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var actorName = await db.Users.AsNoTracking()
            .Where(x => x.UserId == actorUserId)
            .Select(x => x.FullName)
            .FirstOrDefaultAsync(cancellationToken);

        return MapAdmin(entity, actorName);
    }

    private static ClinicSettingsResponse MapAdmin(ClinicSetting setting, string? updatedByFullName) => new(
        setting.ClinicSettingId,
        setting.ClinicName,
        setting.Tagline,
        setting.Description,
        setting.Phone,
        setting.Email,
        setting.WorkingHours,
        setting.PrimaryLocationName,
        setting.PrimaryLocationAddress,
        setting.SecondaryLocationName,
        setting.SecondaryLocationAddress,
        setting.DefaultExaminationFee,
        setting.PatientBookFee,
        setting.DefaultSlotDurationMinutes,
        setting.DefaultMaxPatientsPerSlot,
        setting.LowStockThreshold,
        setting.NearExpiryDays,
        setting.UpdatedAt,
        setting.UpdatedByUserId,
        updatedByFullName);

    private static string RequireText(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
            throw new AppException(ErrorCode.INVALID_REQUEST);
        return trimmed;
    }

    private static string? OptionalText(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
            throw new AppException(ErrorCode.INVALID_REQUEST);
        return trimmed;
    }

    private static string RequirePhone(string? value)
    {
        var trimmed = RequireText(value, 30);
        var digitCount = trimmed.Count(char.IsDigit);
        if (digitCount is < 6 or > 15 || !trimmed.All(ch => char.IsDigit(ch) || ch is ' ' or '+' or '-' or '(' or ')'))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        return trimmed;
    }

    private static string RequireEmail(string? value)
    {
        var trimmed = RequireText(value, 100);
        if (trimmed.Contains(' ') || !MailAddress.TryCreate(trimmed, out var parsed)
            || !string.Equals(parsed.Address, trimmed, StringComparison.OrdinalIgnoreCase)
            || !parsed.Host.Contains('.'))
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        return trimmed;
    }

    private static string SerializeAudit(ClinicSetting x) => JsonSerializer.Serialize(new
    {
        x.ClinicName,
        x.Phone,
        x.Email,
        x.WorkingHours,
        x.PrimaryLocationName,
        x.PrimaryLocationAddress,
        x.SecondaryLocationName,
        x.SecondaryLocationAddress,
        x.DefaultExaminationFee,
        x.PatientBookFee,
        x.DefaultSlotDurationMinutes,
        x.DefaultMaxPatientsPerSlot,
        x.LowStockThreshold,
        x.NearExpiryDays
    });
}

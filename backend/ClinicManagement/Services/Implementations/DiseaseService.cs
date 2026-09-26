using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class DiseaseService : IDiseaseService
{
    private readonly IDiseaseRepository _diseaseRepository;

    public DiseaseService(IDiseaseRepository diseaseRepository)
    {
        _diseaseRepository = diseaseRepository;
    }

    public async Task<PagedResponse<DiseaseResponse>> GetPagedAsync(
        DiseaseFilterRequest request)
    {
        var (items, totalItems) =
            await _diseaseRepository.GetPagedAsync(request);

        var responses = items
            .Select(x => x.ToResponse())
            .ToList();

        return new PagedResponse<DiseaseResponse>(
            responses,
            request.PageNumber,
            request.PageSize,
            totalItems
        );
    }

    public async Task<IReadOnlyList<DiseaseOptionResponse>> GetOptionsAsync(
        bool includeInactive = false)
    {
        var diseases =
            await _diseaseRepository.GetOptionsAsync(includeInactive);

        return diseases
            .Select(x => x.ToOptionResponse())
            .ToList();
    }

    public async Task<DiseaseResponse> GetByIdAsync(int diseaseId)
    {
        var disease =
            await _diseaseRepository.GetByIdAsync(diseaseId);

        if (disease == null)
        {
            throw new AppException(ErrorCode.DISEASE_NOT_FOUND);
        }

        return disease.ToResponse();
    }

    public async Task<DiseaseResponse> CreateAsync(
        CreateDiseaseRequest request)
    {
        ValidateDisease(request.DiseaseCode, request.DiseaseName);

        await EnsureDiseaseCodeAvailableAsync(request.DiseaseCode);
        await EnsureDiseaseNameAvailableAsync(request.DiseaseName);

        var disease = new Disease
        {
            DiseaseCode = request.DiseaseCode.Trim(),
            DiseaseName = request.DiseaseName.Trim(),
            Description = NormalizeOptionalText(request.Description),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _diseaseRepository.AddAsync(disease);
        await _diseaseRepository.SaveChangesAsync();

        return await GetByIdAsync(disease.DiseaseId);
    }

    public async Task<DiseaseResponse> UpdateAsync(
        int diseaseId,
        UpdateDiseaseRequest request)
    {
        ValidateDisease(request.DiseaseCode, request.DiseaseName);

        var disease =
            await _diseaseRepository.GetByIdAsync(diseaseId);

        if (disease == null)
        {
            throw new AppException(ErrorCode.DISEASE_NOT_FOUND);
        }

        await EnsureDiseaseCodeAvailableAsync(
            request.DiseaseCode,
            diseaseId
        );

        await EnsureDiseaseNameAvailableAsync(
            request.DiseaseName,
            diseaseId
        );

        disease.DiseaseCode = request.DiseaseCode.Trim();
        disease.DiseaseName = request.DiseaseName.Trim();
        disease.Description = NormalizeOptionalText(
            request.Description
        );
        disease.IsActive = request.IsActive;

        await _diseaseRepository.SaveChangesAsync();

        return await GetByIdAsync(diseaseId);
    }

    public async Task DeleteAsync(int diseaseId)
    {
        var disease =
            await _diseaseRepository.GetByIdAsync(diseaseId);

        if (disease == null)
        {
            throw new AppException(ErrorCode.DISEASE_NOT_FOUND);
        }

        if (await _diseaseRepository.HasDiagnosesAsync(diseaseId))
        {
            throw new AppException(ErrorCode.DISEASE_HAS_DIAGNOSES);
        }

        _diseaseRepository.Remove(disease);
        await _diseaseRepository.SaveChangesAsync();
    }

    private static void ValidateDisease(
        string diseaseCode,
        string diseaseName)
    {
        if (string.IsNullOrWhiteSpace(diseaseCode) ||
            string.IsNullOrWhiteSpace(diseaseName))
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    private async Task EnsureDiseaseCodeAvailableAsync(
        string diseaseCode,
        int? excludedDiseaseId = null)
    {
        var exists =
            await _diseaseRepository.ExistsByCodeAsync(
                diseaseCode,
                excludedDiseaseId
            );

        if (exists)
        {
            throw new AppException(ErrorCode.DISEASE_CODE_EXISTED);
        }
    }

    private async Task EnsureDiseaseNameAvailableAsync(
        string diseaseName,
        int? excludedDiseaseId = null)
    {
        var exists =
            await _diseaseRepository.ExistsByNameAsync(
                diseaseName,
                excludedDiseaseId
            );

        if (exists)
        {
            throw new AppException(ErrorCode.DISEASE_NAME_EXISTED);
        }
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}

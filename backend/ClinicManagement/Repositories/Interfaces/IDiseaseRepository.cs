using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;

namespace ClinicManagement.Repositories.Interfaces;

public interface IDiseaseRepository
{
    Task<(IEnumerable<Disease> Items, int TotalItems)> GetPagedAsync(
        DiseaseFilterRequest request);

    Task<IReadOnlyList<Disease>> GetOptionsAsync(
        bool includeInactive = false);

    Task<Disease?> GetByIdAsync(int diseaseId);

    Task<bool> ExistsByCodeAsync(
        string diseaseCode,
        int? excludedDiseaseId = null);

    Task<bool> ExistsByNameAsync(
        string diseaseName,
        int? excludedDiseaseId = null);

    Task<bool> HasDiagnosesAsync(int diseaseId);

    Task AddAsync(Disease disease);

    void Remove(Disease disease);

    Task SaveChangesAsync();
}

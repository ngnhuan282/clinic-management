using ClinicManagement.DTOs.Requests.Diseases;
using ClinicManagement.DTOs.Responses.Diseases;
using ClinicManagement.DTOs.Responses.Shared;


namespace ClinicManagement.Services.Interfaces;

public interface IDiseaseService
{
    Task<PagedResponse<DiseaseResponse>> GetPagedAsync(
        DiseaseFilterRequest request);

    Task<IReadOnlyList<DiseaseOptionResponse>> GetOptionsAsync(
        bool includeInactive = false);

    Task<DiseaseResponse> GetByIdAsync(int diseaseId);

    Task<DiseaseResponse> CreateAsync(CreateDiseaseRequest request);

    Task<DiseaseResponse> UpdateAsync(
        int diseaseId,
        UpdateDiseaseRequest request);

    Task DeleteAsync(int diseaseId);
}

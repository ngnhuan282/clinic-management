using ClinicManagement.DTOs.LabTestTypes;

namespace ClinicManagement.Services.Interfaces
{
    public interface ILabTestTypeService
    {
        Task<IEnumerable<LabTestTypeDto>> GetAllAsync(bool includeInactive = false);
        Task<LabTestTypeDto?> GetByIdAsync(int id);
        Task<LabTestTypeDto> CreateAsync(CreateLabTestTypeDto dto);
        Task<bool> UpdateAsync(int id, UpdateLabTestTypeDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
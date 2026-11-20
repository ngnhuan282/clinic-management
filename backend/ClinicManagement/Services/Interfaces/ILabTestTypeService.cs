using ClinicManagement.DTOs.Requests.Laboratory;
using ClinicManagement.DTOs.Responses.Laboratory;


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
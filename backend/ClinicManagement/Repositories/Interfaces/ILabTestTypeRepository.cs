using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces
{
    public interface ILabTestTypeRepository
    {
        Task<IEnumerable<LabTestType>> GetAllAsync(bool includeInactive = false);
        Task<LabTestType?> GetByIdAsync(int id);
        Task<LabTestType> CreateAsync(LabTestType entity);
        Task UpdateAsync(LabTestType entity);
        Task DeleteAsync(int id); // Soft delete (IsActive = false)
    }
}
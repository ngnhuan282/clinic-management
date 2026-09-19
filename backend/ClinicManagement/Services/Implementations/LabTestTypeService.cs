using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.LabTestTypes;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations
{
    public class LabTestTypeService : ILabTestTypeService
    {
        private readonly ILabTestTypeRepository _repository;

        public LabTestTypeService(ILabTestTypeRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<LabTestTypeDto>> GetAllAsync(bool includeInactive = false)
        {
            var entities = await _repository.GetAllAsync(includeInactive);
            return entities.Select(e => new LabTestTypeDto
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                Price = e.Price,
                IsActive = e.IsActive
            });
        }

        public async Task<LabTestTypeDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return null;

            return new LabTestTypeDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                Price = entity.Price,
                IsActive = entity.IsActive
            };
        }

        public async Task<LabTestTypeDto> CreateAsync(CreateLabTestTypeDto dto)
        {
            var entity = new LabTestType
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                IsActive = true
            };

            var created = await _repository.CreateAsync(entity);
            return new LabTestTypeDto
            {
                Id = created.Id,
                Name = created.Name,
                Description = created.Description,
                Price = created.Price,
                IsActive = created.IsActive
            };
        }

        public async Task<bool> UpdateAsync(int id, UpdateLabTestTypeDto dto)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            existing.Name = dto.Name;
            existing.Description = dto.Description;
            existing.Price = dto.Price;
            existing.IsActive = dto.IsActive;

            await _repository.UpdateAsync(existing);
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }
    }
}
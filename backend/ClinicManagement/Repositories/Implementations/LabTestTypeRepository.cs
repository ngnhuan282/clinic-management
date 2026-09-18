using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations
{
    public class LabTestTypeRepository : ILabTestTypeRepository
    {
        private readonly ApplicationDbContext _context;

        public LabTestTypeRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<LabTestType>> GetAllAsync(bool includeInactive = false)
        {
            var query = _context.LabTestTypes.AsNoTracking();
            if (!includeInactive)
            {
                query = query.Where(x => x.IsActive);
            }
            return await query.OrderByDescending(x => x.Id).ToListAsync();
        }

        public async Task<LabTestType?> GetByIdAsync(int id)
        {
            return await _context.LabTestTypes.FindAsync(id);
        }

        public async Task<LabTestType> CreateAsync(LabTestType entity)
        {
            await _context.LabTestTypes.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task UpdateAsync(LabTestType entity)
        {
            entity.UpdatedAt = DateTime.UtcNow;
            _context.LabTestTypes.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.LabTestTypes.FindAsync(id);
            if (entity != null)
            {
                entity.IsActive = false; // Soft delete để an toàn cho LabTests sau này
                entity.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }
}
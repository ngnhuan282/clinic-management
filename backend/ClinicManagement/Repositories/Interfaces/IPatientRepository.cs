using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IPatientRepository
{
    Task<Patient?> GetByUserIdAsync(
        int userId,
        bool trackChanges = false);

    Task<bool> HasProfileForUserAsync(
        int userId);

    Task<bool> IdentityNumberInUseAsync(
        string identityNumber,
        int exceptPatientId);

    Task SaveChangesAsync();
}

using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int userId);
    Task<(List<User> Items, int Total)> GetPageAsync(ClinicManagement.DTOs.Requests.UserQuery query);
    Task<List<ClinicManagement.DTOs.Responses.UserRoleCountResponse>> GetRoleCountsAsync(ClinicManagement.DTOs.Requests.UserQuery query);
    Task<List<ClinicManagement.DTOs.Responses.AccountDoctorResponse>> GetAccountDoctorsAsync(IEnumerable<int> userIds);
    Task<(List<ClinicManagement.DTOs.Responses.AccountDoctorResponse> Items, int Total)> GetAvailableDoctorsAsync(ClinicManagement.DTOs.Requests.AvailableDoctorQuery query);
    Task<Doctor?> GetDoctorForLinkAsync(int doctorId);
    Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginAccessUpdateAsync();
    Task<int> CountActiveAdminsAsync();
    Task RevokeRefreshTokensAsync(int userId);
    Task<User?> GetByUsernameAsync(string username);

    Task<User?> GetByEmailAsync(string email);

    Task AddAsync(User user);

    Task SaveChangesAsync();
}

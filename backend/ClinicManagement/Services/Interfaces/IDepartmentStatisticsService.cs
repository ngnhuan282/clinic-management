using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IDepartmentStatisticsService
{
    Task<DepartmentStatisticsResponse> GetAsync(DepartmentStatisticsQuery query,
        CancellationToken cancellationToken = default);
}

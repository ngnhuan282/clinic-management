using ClinicManagement.DTOs.Requests.Reports;
using ClinicManagement.DTOs.Responses.Reports;


namespace ClinicManagement.Services.Interfaces;

public interface IDepartmentStatisticsService
{
    Task<DepartmentStatisticsResponse> GetAsync(DepartmentStatisticsQuery query,
        CancellationToken cancellationToken = default);
}

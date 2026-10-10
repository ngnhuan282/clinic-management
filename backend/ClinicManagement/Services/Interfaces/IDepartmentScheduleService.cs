using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IDepartmentScheduleService
{
    Task<DepartmentScheduleOptionsResponse> GetOptionsAsync();
    Task<List<DepartmentScheduleResponse>> ListAsync(DepartmentScheduleQuery query);
}

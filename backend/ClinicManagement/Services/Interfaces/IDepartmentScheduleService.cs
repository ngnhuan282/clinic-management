using ClinicManagement.DTOs.Requests.Schedules;
using ClinicManagement.DTOs.Responses.Schedules;


namespace ClinicManagement.Services.Interfaces;

public interface IDepartmentScheduleService
{
    Task<DepartmentScheduleOptionsResponse> GetOptionsAsync();
    Task<List<DepartmentScheduleResponse>> ListAsync(DepartmentScheduleQuery query);
}

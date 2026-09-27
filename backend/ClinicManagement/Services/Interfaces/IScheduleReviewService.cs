using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IScheduleReviewService
{
    Task<PagedResponse<ScheduleRequestResponse>> ListAsync(string? status, int pageNumber, int pageSize);
    Task<ScheduleRequestResponse> GetAsync(int id);
    Task<ScheduleRequestResponse> ApproveAsync(int id);
    Task<ScheduleRequestResponse> RejectAsync(int id, string reason);
}

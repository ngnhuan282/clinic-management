using ClinicManagement.DTOs.Requests.Reviews;
using ClinicManagement.DTOs.Requests.Shared;
using ClinicManagement.DTOs.Responses.Reviews;
using ClinicManagement.DTOs.Responses.Shared;


namespace ClinicManagement.Services.Interfaces;

public interface IReviewService
{
    Task<PagedResponse<ReviewResponse>> ListPublicAsync(ReviewQuery query);
    Task<PagedResponse<AdminReviewResponse>> ListAdminAsync(ReviewQuery query);
    Task<ReviewStatisticsResponse> GetAdminStatisticsAsync(ReviewQuery query);
    Task<PagedResponse<ReviewAppointmentResponse>> MyAppointmentsAsync(PaginationRequest query);
    Task<AdminReviewResponse> CreateAsync(CreateReviewRequest request);
    Task<AdminReviewResponse> SetVisibilityAsync(int id, bool visible);
}

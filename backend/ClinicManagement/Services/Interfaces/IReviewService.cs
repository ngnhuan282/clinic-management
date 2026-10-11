using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IReviewService
{
    Task<PagedResponse<ReviewResponse>> ListPublicAsync(ReviewQuery query);
    Task<PagedResponse<AdminReviewResponse>> ListAdminAsync(ReviewQuery query);
    Task<PagedResponse<ReviewAppointmentResponse>> MyAppointmentsAsync(PaginationRequest query);
    Task<AdminReviewResponse> CreateAsync(CreateReviewRequest request);
    Task<AdminReviewResponse> SetVisibilityAsync(int id, bool visible);
}

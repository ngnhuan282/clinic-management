using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Implementations;
using ClinicManagement.Services.Interfaces;
using ClinicManagement.Validators;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class ReviewService(ReviewRepository repository, ICurrentUserService currentUser) : IReviewService
{
    private IQueryable<Review> Filter(ReviewQuery query, bool publicOnly)
    {
        var rows = repository.Query();
        if (publicOnly) rows = rows.Where(x => x.IsVisible);
        if (query.DoctorId.HasValue) rows = rows.Where(x => x.DoctorId == query.DoctorId);
        return rows;
    }

    public async Task<PagedResponse<ReviewResponse>> ListPublicAsync(ReviewQuery query)
    {
        var rows = Filter(query, true);
        var total = await rows.CountAsync();
        var items = await rows.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.ReviewId)
            .Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize)
            .Select(ReviewMappings.Public).ToListAsync();
        return new(items, query.PageNumber, query.PageSize, total);
    }

    public async Task<PagedResponse<AdminReviewResponse>> ListAdminAsync(ReviewQuery query)
    {
        RequireRole(RoleConstants.Admin);
        var rows = Filter(query, false);
        var total = await rows.CountAsync();
        var items = await rows.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.ReviewId)
            .Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize)
            .Select(ReviewMappings.Admin).ToListAsync();
        return new(items, query.PageNumber, query.PageSize, total);
    }

    public async Task<PagedResponse<ReviewAppointmentResponse>> MyAppointmentsAsync(PaginationRequest query)
    {
        RequireRole(RoleConstants.Patient);
        var rows = repository.AppointmentsFor(currentUser.GetRequiredUserId()).Where(x => x.Status == AppointmentStatusConstants.Completed);
        var total = await rows.CountAsync();
        var items = await (from appointment in rows
            join review in repository.Query() on appointment.AppointmentId equals review.AppointmentId into reviews
            from review in reviews.DefaultIfEmpty()
            orderby appointment.AppointmentDate descending, appointment.AppointmentId descending
            select new ReviewAppointmentResponse(appointment.AppointmentId, appointment.DoctorId, appointment.Doctor.FullName,
                appointment.AppointmentDate, review == null ? null : review.ReviewId, review == null ? null : (int?)review.Rating,
                review == null ? null : review.Comment, review == null ? null : review.IsVisible))
            .Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToListAsync();
        return new(items, query.PageNumber, query.PageSize, total);
    }

    public async Task<AdminReviewResponse> CreateAsync(CreateReviewRequest request)
    {
        RequireRole(RoleConstants.Patient);
        ReviewValidator.Validate(request);
        var appointment = await repository.GetAppointmentAsync(request.AppointmentId)
            ?? throw new AppException(ErrorCode.APPOINTMENT_NOT_FOUND);
        if (appointment.PatientId != currentUser.GetRequiredUserId()) throw new AppException(ErrorCode.UNAUTHORIZED);
        if (appointment.Status != AppointmentStatusConstants.Completed) throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);
        if (await repository.Query().AnyAsync(x => x.AppointmentId == appointment.AppointmentId))
            throw new AppException(ErrorCode.REVIEW_EXISTED);
        var review = new Review { AppointmentId = appointment.AppointmentId, DoctorId = appointment.DoctorId,
            PatientId = appointment.PatientProfileId ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND),
            Rating = (byte)request.Rating, Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
            IsVisible = true, CreatedAt = DateTime.UtcNow };
        try { await repository.AddAsync(review); }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new AppException(ErrorCode.REVIEW_EXISTED); }
        return await ResponseAsync(review.ReviewId);
    }

    public async Task<AdminReviewResponse> SetVisibilityAsync(int id, bool visible)
    {
        RequireRole(RoleConstants.Admin);
        var review = await repository.GetAsync(id) ?? throw new AppException(ErrorCode.REVIEW_NOT_FOUND);
        review.IsVisible = visible;
        await repository.SaveAsync();
        return await ResponseAsync(id);
    }

    private Task<AdminReviewResponse> ResponseAsync(int id) => repository.Query().Where(x => x.ReviewId == id)
        .Select(ReviewMappings.Admin).SingleAsync();

    private void RequireRole(string role)
    {
        currentUser.GetRequiredUserId();
        if (currentUser.Role != role) throw new AppException(ErrorCode.UNAUTHORIZED);
    }
}

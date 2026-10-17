using System.Linq.Expressions;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Mappings;

public static class ReviewMappings
{
    public static readonly Expression<Func<Review, AdminReviewResponse>> Admin = x =>
        new(x.ReviewId, x.AppointmentId, x.PatientId, x.DoctorId, x.Doctor.FullName,
            x.Rating, x.Comment, x.IsVisible, x.CreatedAt);

    public static readonly Expression<Func<Review, ReviewResponse>> Public = x =>
        new(x.ReviewId, x.DoctorId, x.Doctor.FullName, x.Rating, x.Comment, x.CreatedAt);
}

namespace ClinicManagement.DTOs.Responses;

public record ReviewTotalsResponse(int TotalReviews, int VisibleReviews, int HiddenReviews,
    double? AverageRating, double? PublicAverageRating);

public record DoctorRatingSummaryResponse(int DoctorId, string DoctorName, string DepartmentName,
    int TotalReviews, int VisibleReviews, int HiddenReviews, double? AverageRating, double? PublicAverageRating);

public record ReviewStatisticsResponse(ReviewTotalsResponse Totals,
    PagedResponse<DoctorRatingSummaryResponse> Doctors);

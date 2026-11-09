using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Repositories.Implementations;

public class ReviewRepository(ApplicationDbContext db)
{
    public IQueryable<Review> Query() => db.Reviews.AsNoTracking();
    public async Task<ReviewStatisticsResponse> GetAdminStatisticsAsync(ReviewQuery query)
    {
        var reviews = Query();
        if (query.DoctorId.HasValue) reviews = reviews.Where(x => x.DoctorId == query.DoctorId.Value);
        var totals = await reviews.GroupBy(x => 1).Select(group => new ReviewTotalsResponse(
            group.Count(), group.Count(x => x.IsVisible), group.Count(x => !x.IsVisible),
            group.Average(x => (double?)x.Rating),
            group.Where(x => x.IsVisible).Average(x => (double?)x.Rating))).SingleOrDefaultAsync()
            ?? new ReviewTotalsResponse(0, 0, 0, null, null);
        var groups = reviews.GroupBy(x => new { x.DoctorId, x.Doctor.FullName, DepartmentName = x.Doctor.Department.Name });
        var totalDoctors = await groups.CountAsync();
        var items = await groups.OrderBy(group => group.Key.FullName).ThenBy(group => group.Key.DoctorId)
            .Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize)
            .Select(group => new DoctorRatingSummaryResponse(group.Key.DoctorId, group.Key.FullName,
                group.Key.DepartmentName, group.Count(), group.Count(x => x.IsVisible), group.Count(x => !x.IsVisible),
                group.Average(x => (double?)x.Rating), group.Where(x => x.IsVisible).Average(x => (double?)x.Rating)))
            .ToListAsync();
        return new(totals, new(items, query.PageNumber, query.PageSize, totalDoctors));
    }
    public IQueryable<Appointment> AppointmentsFor(int userId) => db.Appointments.AsNoTracking().Where(x => x.PatientId == userId);
    public Task<Appointment?> GetAppointmentAsync(int id) => db.Appointments.AsNoTracking().SingleOrDefaultAsync(x => x.AppointmentId == id);
    public Task<Review?> GetAsync(int id) => db.Reviews.SingleOrDefaultAsync(x => x.ReviewId == id);
    public async Task AddAsync(Review review) { db.Reviews.Add(review); await db.SaveChangesAsync(); }
    public Task SaveAsync() => db.SaveChangesAsync();
}

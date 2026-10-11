using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public class ReviewRepository(ApplicationDbContext db)
{
    public IQueryable<Review> Query() => db.Reviews.AsNoTracking();
    public IQueryable<Appointment> AppointmentsFor(int userId) => db.Appointments.AsNoTracking().Where(x => x.PatientId == userId);
    public Task<Appointment?> GetAppointmentAsync(int id) => db.Appointments.AsNoTracking().SingleOrDefaultAsync(x => x.AppointmentId == id);
    public Task<Review?> GetAsync(int id) => db.Reviews.SingleOrDefaultAsync(x => x.ReviewId == id);
    public async Task AddAsync(Review review) { db.Reviews.Add(review); await db.SaveChangesAsync(); }
    public Task SaveAsync() => db.SaveChangesAsync();
}

using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Repositories.Implementations;

public sealed class VisitReportQuery(ApplicationDbContext db) : IVisitReportQuery
{
    public Task<int> CountAsync(int departmentId, DateOnly fromDate, DateOnly toDate,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(departmentId);
        var start = fromDate.ToDateTime(TimeOnly.MinValue);
        var endExclusive = toDate.AddDays(1).ToDateTime(TimeOnly.MinValue);

        // ExaminationDate is a clinic-local SQL date (C# DateTime), not a UTC audit timestamp.
        return db.MedicalRecords.AsNoTracking()
            .Where(x => x.Doctor.DepartmentId == departmentId
                && x.Appointment.Doctor.DepartmentId == departmentId
                && (x.Appointment.Status == AppointmentStatusConstants.InProgress
                    || x.Appointment.Status == AppointmentStatusConstants.Completed)
                && x.ExaminationDate >= start && x.ExaminationDate < endExclusive)
            .Select(x => x.AppointmentId).Distinct().CountAsync(cancellationToken);
    }
}

namespace ClinicManagement.Repositories.Interfaces;

// Shared A7/Report baseline: callers must resolve and authorize the department first.
public interface IVisitReportQuery
{
    Task<int> CountAsync(int departmentId, DateOnly fromDate, DateOnly toDate,
        CancellationToken cancellationToken = default);
}

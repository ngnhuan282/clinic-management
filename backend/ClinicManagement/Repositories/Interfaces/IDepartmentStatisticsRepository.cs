namespace ClinicManagement.Repositories.Interfaces;

public interface IDepartmentStatisticsRepository
{
    Task<(int Pending, int Approved)> CountScheduleRequestsAsync(int departmentId,
        DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default);
}

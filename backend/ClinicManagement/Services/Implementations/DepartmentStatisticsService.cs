using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;
using ClinicManagement.Validators;
using FluentValidation;

namespace ClinicManagement.Services.Implementations;

public sealed class DepartmentStatisticsService(DepartmentScope scope,
    IValidator<DepartmentStatisticsQuery> validator, IVisitReportQuery visits,
    IDepartmentStatisticsRepository repository) : IDepartmentStatisticsService
{
    public async Task<DepartmentStatisticsResponse> GetAsync(DepartmentStatisticsQuery query,
        CancellationToken cancellationToken = default)
    {
        await validator.ValidateAndThrowAsync(query, cancellationToken);
        var department = await scope.RequireHeadDepartmentAsync(cancellationToken);
        DateOnly fromDate;
        DateOnly toDate;
        if (query.FromDate is null)
        {
            var today = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Asia/Ho_Chi_Minh");
            fromDate = new DateOnly(today.Year, today.Month, 1);
            toDate = fromDate.AddMonths(1).AddDays(-1);
        }
        else
        {
            DepartmentStatisticsQueryValidator.TryParse(query.FromDate, out fromDate);
            DepartmentStatisticsQueryValidator.TryParse(query.ToDate, out toDate);
        }

        var visitCount = await visits.CountAsync(department.DepartmentId, fromDate, toDate, cancellationToken);
        var requests = await repository.CountScheduleRequestsAsync(department.DepartmentId, fromDate, toDate, cancellationToken);
        return new(department.DepartmentId, department.DepartmentName, fromDate, toDate,
            visitCount, requests.Pending, requests.Approved);
    }
}

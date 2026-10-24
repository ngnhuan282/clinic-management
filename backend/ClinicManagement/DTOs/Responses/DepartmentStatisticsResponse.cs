namespace ClinicManagement.DTOs.Responses;

public sealed record DepartmentStatisticsResponse(
    int DepartmentId,
    string DepartmentName,
    DateOnly FromDate,
    DateOnly ToDate,
    int VisitCount,
    int PendingScheduleRequestCount,
    int ApprovedScheduleRequestCount);

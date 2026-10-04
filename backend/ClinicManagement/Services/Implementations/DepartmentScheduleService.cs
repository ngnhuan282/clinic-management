using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class DepartmentScheduleService(IDepartmentScheduleRepository repository, ICurrentUserService currentUser) : IDepartmentScheduleService
{
    private async Task<int> DepartmentAsync()
    {
        if (currentUser.Role != RoleConstants.DepartmentHead) throw new AppException(ErrorCode.UNAUTHORIZED);
        return await repository.GetDepartmentIdAsync(currentUser.GetRequiredUserId())
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    public async Task<DepartmentScheduleOptionsResponse> GetOptionsAsync() => await repository.GetOptionsAsync(await DepartmentAsync());

    public async Task<List<DepartmentScheduleResponse>> ListAsync(DepartmentScheduleQuery query)
    {
        var departmentId = await DepartmentAsync();
        if (query.Date.HasValue == query.WeekStart.HasValue || query.Date == DateOnly.MinValue
            || query.WeekStart == DateOnly.MinValue || query.WeekStart > DateOnly.MaxValue.AddDays(-6))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        if ((query.DoctorId.HasValue && !await repository.HasDoctorAsync(departmentId, query.DoctorId.Value))
            || (query.RoomId.HasValue && !await repository.HasRoomAsync(departmentId, query.RoomId.Value)))
            throw new AppException(ErrorCode.UNAUTHORIZED);
        var start = query.Date ?? query.WeekStart!.Value;
        var end = query.Date ?? start.AddDays(6);
        return await repository.ListAsync(departmentId, start, end, query.DoctorId, query.RoomId);
    }
}

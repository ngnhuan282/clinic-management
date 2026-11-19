using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class StaffService(IStaffRepository repository, IJobPositionRepository jobPositions) : IStaffService
{
    public async Task<PagedResponse<StaffResponse>> GetAsync(StaffQuery query)
    {
        var (items, total) = await repository.GetPageAsync(query);
        return new PagedResponse<StaffResponse>(items.Select(MapAdmin), query.PageNumber, query.PageSize, total);
    }

    public async Task<StaffResponse> GetByIdAsync(int staffId) =>
        MapAdmin(await repository.GetByIdAsync(staffId) ?? throw new AppException(ErrorCode.STAFF_NOT_FOUND));

    public async Task<StaffResponse> CreateAsync(CreateStaffRequest request)
    {
        if (!await jobPositions.IsActiveAsync(request.JobPositionId))
            throw new AppException(ErrorCode.INVALID_JOB_POSITION);

        var now = DateTime.UtcNow;
        var staff = new Staff
        {
            FullName = request.FullName.Trim(),
            JobPositionId = request.JobPositionId,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
        await repository.AddAsync(staff);
        await repository.SaveChangesAsync();
        return MapAdmin(await repository.GetByIdAsync(staff.StaffId) ?? staff);
    }

    public async Task<StaffResponse> UpdateAsync(int staffId, UpdateStaffRequest request)
    {
        var staff = await repository.GetByIdAsync(staffId) ?? throw new AppException(ErrorCode.STAFF_NOT_FOUND);
        if (request.JobPositionId != staff.JobPositionId && !await jobPositions.IsActiveAsync(request.JobPositionId))
            throw new AppException(ErrorCode.INVALID_JOB_POSITION);

        staff.FullName = request.FullName.Trim();
        staff.JobPositionId = request.JobPositionId;
        staff.IsActive = request.IsActive;
        staff.UpdatedAt = DateTime.UtcNow;

        await repository.SaveChangesAsync();
        return MapAdmin(await repository.GetByIdAsync(staffId) ?? staff);
    }

    public async Task UpdateStatusAsync(int staffId, bool isActive)
    {
        var staff = await repository.GetByIdAsync(staffId) ?? throw new AppException(ErrorCode.STAFF_NOT_FOUND);
        staff.IsActive = isActive;
        staff.UpdatedAt = DateTime.UtcNow;
        await repository.SaveChangesAsync();
    }

    private static StaffResponse MapAdmin(Staff staff) => new()
    {
        StaffId = staff.StaffId,
        FullName = staff.FullName,
        JobPositionId = staff.JobPositionId,
        JobPositionName = staff.JobPosition.Name,
        IsActive = staff.IsActive,
        UserId = staff.UserId,
        Username = staff.User?.Username
    };
}

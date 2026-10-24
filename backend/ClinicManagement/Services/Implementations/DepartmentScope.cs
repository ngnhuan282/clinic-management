using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Exceptions;
using ClinicManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class DepartmentScope(ApplicationDbContext db, ICurrentUserService currentUser)
{
    public async Task<(int DepartmentId, string DepartmentName)> RequireHeadDepartmentAsync(
        CancellationToken cancellationToken = default)
    {
        var userId = currentUser.GetRequiredUserId();
        if (currentUser.Role != RoleConstants.DepartmentHead) throw new AppException(ErrorCode.UNAUTHORIZED);
        var department = await db.Doctors.AsNoTracking()
            .Where(x => x.UserId == userId && x.DepartmentId > 0 && x.IsActive && x.Department.IsActive)
            .Select(x => new { x.DepartmentId, DepartmentName = x.Department.Name })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new AppException(ErrorCode.DEPARTMENT_SCOPE_REQUIRED);
        return (department.DepartmentId, department.DepartmentName);
    }

    public async Task<int?> ForHeadAsync()
    {
        if (currentUser.Role != RoleConstants.DepartmentHead) return null;
        return await db.Doctors.AsNoTracking().Where(x => x.UserId == currentUser.GetRequiredUserId()
                && x.IsActive && x.Department.IsActive)
            .Select(x => (int?)x.DepartmentId).SingleOrDefaultAsync()
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    public async Task ValidateFiltersAsync(int? departmentId, int? doctorId, int? roomId)
    {
        if (departmentId is null) return;
        if ((doctorId.HasValue && !await db.Doctors.AnyAsync(x => x.DoctorId == doctorId && x.DepartmentId == departmentId))
            || (roomId.HasValue && !await db.Rooms.AnyAsync(x => x.RoomId == roomId && x.DepartmentId == departmentId)))
            throw new AppException(ErrorCode.UNAUTHORIZED);
    }
}

using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Exceptions;
using ClinicManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class DepartmentScope(ApplicationDbContext db, ICurrentUserService currentUser)
{
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

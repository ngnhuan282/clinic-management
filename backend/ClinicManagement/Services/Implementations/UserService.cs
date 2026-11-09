using ClinicManagement.Commons;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Hubs;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using System.Text.Json;
using ClinicManagement.Validators;

namespace ClinicManagement.Services.Implementations;

public class UserService(IUserRepository users, IRoleRepository roles, ICurrentUserService currentUser,
    NotificationConnections connections, ApplicationDbContext db, IPasswordHasherService passwordHasher) : IUserService
{
    public async Task<UserResponse> GetMyProfileAsync()
    {
        var user = await GetByIdAsync(currentUser.GetRequiredUserId());
        var permissions = await db.RolePermissions.AsNoTracking().Where(x => x.RoleId == user.RoleId)
            .Select(x => x.PermissionCode).OrderBy(x => x).ToListAsync();
        return user with { Permissions = permissions };
    }

    public async Task<UserResponse> UpdateMyProfileAsync(UpdateMyProfileRequest request)
    {
        ClinicManagement.Validators.MyProfileValidator.Validate(request);
        var userId = currentUser.GetRequiredUserId();
        var user = await users.GetByIdAsync(userId) ?? throw new AppException(ErrorCode.USER_NOT_FOUND);
        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        if (email is not null && await users.GetByEmailAsync(email) is { } existing && existing.UserId != userId)
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        user.FullName = request.FullName.Trim();
        user.Email = email;
        user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        try { await users.SaveChangesAsync(); }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new AppException(ErrorCode.EMAIL_EXISTED); }
        catch (DbUpdateConcurrencyException) { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
        return await GetMyProfileAsync();
    }

    public async Task<PagedResponse<UserResponse>> GetPageAsync(UserQuery query)
    {
        var (items, total) = await users.GetPageAsync(query);
        var doctors = (await users.GetAccountDoctorsAsync(items.Select(x => x.UserId)))
            .ToDictionary(x => x.UserId!.Value);
        var responses = items.Select(user =>
        {
            var doctor = doctors.GetValueOrDefault(user.UserId);
            return user.ToResponse() with { DoctorId = doctor?.DoctorId,
                DoctorName = doctor?.FullName, DepartmentName = doctor?.DepartmentName };
        });
        return new(responses, query.PageNumber, query.PageSize, total);
    }

    public async Task<UserSummaryResponse> GetSummaryAsync(UserQuery query)
    {
        var counts = await users.GetRoleCountsAsync(query);
        var total = counts.Sum(x => x.Total);
        var active = counts.Sum(x => x.Active);
        return new(total, active, total - active, counts);
    }

    public async Task<PagedResponse<AccountDoctorResponse>> GetAvailableDoctorsAsync(AvailableDoctorQuery query)
    {
        var (items, total) = await users.GetAvailableDoctorsAsync(query);
        return new(items, query.PageNumber, query.PageSize, total);
    }

    public async Task<UserResponse> CreateStaffAsync(CreateStaffUserRequest request)
    {
        UserAccountValidator.ValidateCreate(request);
        var actorId = currentUser.GetRequiredUserId();
        var passwordHash = passwordHasher.HashPassword(request.Password);
        try
        {
            await using var transaction = await users.BeginAccessUpdateAsync();
            var role = await roles.GetByIdAsync(request.RoleId) ?? throw new AppException(ErrorCode.ROLE_NOT_FOUND);
            if (role.RoleName == RoleConstants.Patient) throw new AppException(ErrorCode.INVALID_REQUEST);
            Doctor? doctor = null;
            if (role.RoleName is RoleConstants.Doctor or RoleConstants.DepartmentHead)
            {
                if (!request.DoctorId.HasValue) throw new AppException(ErrorCode.INVALID_REQUEST);
                doctor = await users.GetDoctorForLinkAsync(request.DoctorId.Value)
                    ?? throw new AppException(ErrorCode.DOCTOR_NOT_FOUND);
                if (doctor.UserId.HasValue) throw new AppException(ErrorCode.USER_ACCESS_CONFLICT);
            }
            else if (request.DoctorId.HasValue) throw new AppException(ErrorCode.INVALID_REQUEST);

            var username = request.Username.Trim();
            var email = NormalizeOptional(request.Email);
            if (await users.GetByUsernameAsync(username) != null) throw new AppException(ErrorCode.USER_EXISTED);
            if (email != null && await users.GetByEmailAsync(email) != null) throw new AppException(ErrorCode.EMAIL_EXISTED);
            var user = new User
            {
                Username = username, FullName = request.FullName.Trim(), Email = email,
                Phone = NormalizeOptional(request.Phone), PasswordHash = passwordHash,
                RoleId = role.RoleId, Role = role, Status = true, CreatedAt = DateTime.UtcNow
            };
            await users.AddAsync(user);
            await users.SaveChangesAsync();
            if (doctor != null) doctor.UserId = user.UserId;
            db.RbacAudits.Add(new RbacAudit
            {
                ActorUserId = actorId, Action = "user.create", EntityType = "User", EntityId = user.UserId,
                AfterJson = JsonSerializer.Serialize(new { user.Username, user.FullName, user.RoleId, DoctorId = doctor?.DoctorId }),
                CreatedAt = DateTime.UtcNow
            });
            await users.SaveChangesAsync();
            await transaction.CommitAsync();
            // Staff creation never issues auth tokens or writes the administrator's refresh cookie.
            return user.ToResponse() with { DoctorId = doctor?.DoctorId,
                DoctorName = doctor?.FullName, DepartmentName = doctor?.Department.Name };
        }
        catch (DbUpdateConcurrencyException) { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 2601 or 2627 } sql)
        {
            throw new AppException(sql.Message.Contains("IX_Users_Email", StringComparison.Ordinal)
                ? ErrorCode.EMAIL_EXISTED : sql.Message.Contains("IX_Users_Username", StringComparison.Ordinal)
                    ? ErrorCode.USER_EXISTED : ErrorCode.USER_ACCESS_CONFLICT);
        }
        catch (Exception error) when (IsDeadlock(error)) { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
    }

    public async Task<UserResponse> UpdateProfileAsync(int userId, UpdateUserProfileRequest request)
    {
        UserAccountValidator.ValidateProfile(request);
        var actorId = currentUser.GetRequiredUserId();
        try
        {
            await using var transaction = await users.BeginAccessUpdateAsync();
            var user = await users.GetByIdAsync(userId) ?? throw new AppException(ErrorCode.USER_NOT_FOUND);
            var email = NormalizeOptional(request.Email);
            if (email != null && await users.GetByEmailAsync(email) is { } existing && existing.UserId != userId)
                throw new AppException(ErrorCode.EMAIL_EXISTED);
            var before = new { user.FullName, user.Email, user.Phone };
            user.FullName = request.FullName.Trim();
            user.Email = email;
            user.Phone = NormalizeOptional(request.Phone);
            db.RbacAudits.Add(new RbacAudit
            {
                ActorUserId = actorId, Action = "user.profile", EntityType = "User", EntityId = userId,
                BeforeJson = JsonSerializer.Serialize(before),
                AfterJson = JsonSerializer.Serialize(new { user.FullName, user.Email, user.Phone }),
                CreatedAt = DateTime.UtcNow
            });
            await users.SaveChangesAsync();
            await transaction.CommitAsync();
            return user.ToResponse();
        }
        catch (DbUpdateConcurrencyException) { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new AppException(ErrorCode.EMAIL_EXISTED); }
        catch (Exception error) when (IsDeadlock(error)) { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
    }

    private static string? NormalizeOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool IsDeadlock(Exception error)
    {
        for (Exception? current = error; current != null; current = current.InnerException)
            if (current is SqlException { Number: 1205 }) return true;
        return false;
    }

    public async Task<UserResponse> GetByIdAsync(int userId) =>
        (await users.GetByIdAsync(userId) ?? throw new AppException(ErrorCode.USER_NOT_FOUND)).ToResponse();

    public async Task<List<RoleResponse>> GetRolesAsync() => (await roles.GetAllAsync())
        .Select(x => new RoleResponse(x.RoleId, x.RoleName, x.Description, x.IsSystem)).ToList();

    public async Task<UserResponse> UpdateAccessAsync(int userId, int? roleId, bool? status)
    {
        try
        {
            await using var transaction = await users.BeginAccessUpdateAsync();
            var user = await users.GetByIdAsync(userId) ?? throw new AppException(ErrorCode.USER_NOT_FOUND);
            var role = roleId.HasValue
                ? await roles.GetByIdAsync(roleId.Value) ?? throw new AppException(ErrorCode.ROLE_NOT_FOUND)
                : user.Role;
            var active = status ?? user.Status;
            if (role.RoleId == user.RoleId && active == user.Status) return user.ToResponse();
            if (userId == currentUser.GetRequiredUserId()) throw new AppException(ErrorCode.SELF_ACCESS_CHANGE);
            if (user.Status && user.Role.RoleName == RoleConstants.Admin
                && (!active || role.RoleName != RoleConstants.Admin)
                && await users.CountActiveAdminsAsync() <= 1)
                throw new AppException(ErrorCode.LAST_ADMIN);

            var before = new { user.RoleId, Role = user.Role.RoleName, user.Status };
            user.RoleId = role.RoleId;
            user.Role = role;
            user.Status = active;
            user.SecurityVersion++;
            await users.SaveChangesAsync();
            await users.RevokeRefreshTokensAsync(userId);
            db.RbacAudits.Add(new RbacAudit
            {
                ActorUserId = currentUser.GetRequiredUserId(), Action = roleId.HasValue ? "user.role" : "user.status",
                EntityType = "User", EntityId = userId,
                BeforeJson = JsonSerializer.Serialize(before),
                AfterJson = JsonSerializer.Serialize(new { user.RoleId, Role = role.RoleName, user.Status }),
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            connections.DisconnectUser(userId);
            return user.ToResponse();
        }
        catch (DbUpdateConcurrencyException) { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
        catch (SqlException error) when (error.Number == 1205) { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 1205 })
        { throw new AppException(ErrorCode.USER_ACCESS_CONFLICT); }
    }

}

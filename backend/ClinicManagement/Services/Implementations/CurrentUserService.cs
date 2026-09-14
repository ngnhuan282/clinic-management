using ClinicManagement.Commons;
using ClinicManagement.Exceptions;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(
        IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private HttpContext? HttpContext =>
        _httpContextAccessor.HttpContext;

    public bool IsAuthenticated =>
        HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    public int? UserId
    {
        get
        {
            var userIdClaim = HttpContext?.User
                .FindFirst(ClaimConstants.UserId)
                ?.Value;

            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            return null;
        }
    }

    public string? Role =>
        HttpContext?.User
            .FindFirst(ClaimConstants.Role)
            ?.Value;

    public int GetRequiredUserId()
    {
        if (!IsAuthenticated || UserId is null)
        {
            throw new AppException(
                ErrorCode.UNAUTHENTICATED
            );
        }

        return UserId.Value;
    }
}
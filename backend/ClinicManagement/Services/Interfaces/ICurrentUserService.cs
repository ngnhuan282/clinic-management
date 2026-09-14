namespace ClinicManagement.Services.Interfaces;

public interface ICurrentUserService
{
    bool IsAuthenticated { get; }

    int? UserId { get; }

    string? Role { get; }

    int GetRequiredUserId();
}
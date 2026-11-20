using ClinicManagement.DTOs.Responses.Users;
using ClinicManagement.Data.Entities;

namespace ClinicManagement.Mappings;

public static class UserMappings
{
    public static UserResponse ToResponse(this User user) => new(user.UserId, user.Username,
        user.FullName, user.Email, user.Phone, user.RoleId, user.Role.RoleName, user.Status, user.CreatedAt);
}

using System.Text;
using System.Text.RegularExpressions;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Exceptions;

namespace ClinicManagement.Validators;

public static class UserAccountValidator
{
    public static void ValidateProfile(UpdateUserProfileRequest request) =>
        MyProfileValidator.Validate(new UpdateMyProfileRequest
        {
            FullName = request.FullName, Email = request.Email, Phone = request.Phone
        });

    public static void ValidateCreate(CreateStaffUserRequest request)
    {
        ValidateProfile(request);
        if (string.IsNullOrWhiteSpace(request.Username)
            || !Regex.IsMatch(request.Username.Trim(), @"^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,49}$")
            || string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8
            || Encoding.UTF8.GetByteCount(request.Password) > 72 || request.Password.Contains('\0')
            || request.RoleId <= 0 || request.DoctorId is <= 0)
            throw new AppException(ErrorCode.INVALID_REQUEST);
    }
}

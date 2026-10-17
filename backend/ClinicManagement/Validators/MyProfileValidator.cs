using System.ComponentModel.DataAnnotations;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Exceptions;

namespace ClinicManagement.Validators;

public static class MyProfileValidator
{
    public static void Validate(UpdateMyProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Length > 100
            || (request.Email is not null && (request.Email.Length > 100
                || (!string.IsNullOrWhiteSpace(request.Email) && !new EmailAddressAttribute().IsValid(request.Email.Trim()))))
            || (request.Phone is not null && (request.Phone.Length > 15
                || (!string.IsNullOrWhiteSpace(request.Phone) && !new PhoneAttribute().IsValid(request.Phone.Trim())))))
            throw new AppException(ErrorCode.INVALID_REQUEST);
    }
}

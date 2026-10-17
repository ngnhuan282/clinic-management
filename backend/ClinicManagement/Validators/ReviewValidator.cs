using ClinicManagement.DTOs.Requests;
using ClinicManagement.Exceptions;

namespace ClinicManagement.Validators;

public static class ReviewValidator
{
    public static void Validate(CreateReviewRequest request)
    {
        if (request.AppointmentId <= 0 || request.Rating is < 1 or > 5 || request.Comment?.Length > 500)
            throw new AppException(ErrorCode.INVALID_REQUEST);
    }
}

using ClinicManagement.DTOs.Requests;
using ClinicManagement.Exceptions;

namespace ClinicManagement.Validators;

public static class BookingRequestValidator
{
    public static void ValidatePagination(AppointmentQuery query)
    {
        if ((long)(query.PageNumber - 1) * query.PageSize > int.MaxValue)
            throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    public static void ValidateTime(DateTime appointmentDate, TimeSpan startTime, DateTime clinicNow)
    {
        // Bound the time before adding it: a valid TimeSpan can overflow DateTime at either boundary.
        if (startTime < TimeSpan.Zero || startTime >= TimeSpan.FromDays(1)
            || appointmentDate.Date.Add(startTime) <= clinicNow)
            throw new AppException(ErrorCode.INVALID_REQUEST);
    }
}

namespace ClinicManagement.Helpers;

public static class ClinicClock
{
    private const string TimeZoneId = "Asia/Ho_Chi_Minh";

    public static DateOnly Today =>
        DateOnly.FromDateTime(
            TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, TimeZoneId));
}

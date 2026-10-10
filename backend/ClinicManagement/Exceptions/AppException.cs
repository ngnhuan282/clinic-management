namespace ClinicManagement.Exceptions;

public class AppException : Exception
{
    public ErrorCode ErrorCode { get; }

    public AppException(
        ErrorCode errorCode,
        string? message = null)
        : base(message ?? errorCode.Message)
    {
        ErrorCode = errorCode;
    }
}

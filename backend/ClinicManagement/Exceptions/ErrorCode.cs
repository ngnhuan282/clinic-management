using System.Net;

namespace ClinicManagement.Exceptions;

public sealed class ErrorCode
{
    public int Code { get; }

    public string Message { get; }

    public HttpStatusCode StatusCode { get; }

    private ErrorCode(
        int code,
        string message,
        HttpStatusCode statusCode)
    {
        Code = code;
        Message = message;
        StatusCode = statusCode;
    }

    // =========================
    // Common errors
    // =========================

    public static readonly ErrorCode UNCATEGORIZED_EXCEPTION =
        new(
            9999,
            "Uncategorized error",
            HttpStatusCode.InternalServerError
        );

    public static readonly ErrorCode INVALID_REQUEST =
        new(
            1001,
            "Invalid request",
            HttpStatusCode.BadRequest
        );

    public static readonly ErrorCode UNAUTHENTICATED =
        new(
            1002,
            "Unauthenticated",
            HttpStatusCode.Unauthorized
        );

    public static readonly ErrorCode UNAUTHORIZED =
        new(
            1003,
            "You do not have permission",
            HttpStatusCode.Forbidden
        );

    // =========================
    // User
    // =========================

    public static readonly ErrorCode USER_EXISTED =
        new(
            2001,
            "User already exists",
            HttpStatusCode.BadRequest
        );

    public static readonly ErrorCode USER_NOT_FOUND =
        new(
            2002,
            "User not found",
            HttpStatusCode.NotFound
        );

    public static readonly ErrorCode INVALID_CREDENTIALS =
        new(
            2003,
            "Invalid username or password",
            HttpStatusCode.Unauthorized
        );

    public static readonly ErrorCode USER_INACTIVE =
        new(
            2004,
            "User account is inactive",
            HttpStatusCode.Forbidden
        );

    public static readonly ErrorCode ROLE_NOT_FOUND =
        new(
            2005,
            "Role not found",
            HttpStatusCode.NotFound
        );
    
    public static readonly ErrorCode EMAIL_EXISTED =
        new(
            2006,
            "Email already exists",
            HttpStatusCode.Conflict
        );
    // =========================
    // Doctor
    // =========================

    public static readonly ErrorCode DOCTOR_NOT_FOUND =
        new(
            3001,
            "Doctor not found",
            HttpStatusCode.NotFound
        );

    // =========================
    // Patient
    // =========================

    public static readonly ErrorCode PATIENT_NOT_FOUND =
        new(
            4001,
            "Patient not found",
            HttpStatusCode.NotFound
        );

    // =========================
    // Appointment
    // =========================

    public static readonly ErrorCode APPOINTMENT_NOT_FOUND =
        new(
            5001,
            "Appointment not found",
            HttpStatusCode.NotFound
        );

    public static readonly ErrorCode APPOINTMENT_CONFLICT =
        new(
            5002,
            "The doctor already has an appointment at this time",
            HttpStatusCode.Conflict
        );

    public static readonly ErrorCode APPOINTMENT_INVALID_STATUS =
        new(
            5003,
            "Invalid appointment status",
            HttpStatusCode.BadRequest
        );
}
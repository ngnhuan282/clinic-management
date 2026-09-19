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

    public static readonly ErrorCode CATALOG_NOT_FOUND =
        new(2100, "Catalog item not found", HttpStatusCode.NotFound);

    public static readonly ErrorCode CATALOG_DUPLICATE =
        new(2101, "Catalog code or number already exists", HttpStatusCode.Conflict);

    public static readonly ErrorCode DEPARTMENT_NOT_FOUND =
        new(2102, "Department not found", HttpStatusCode.NotFound);

    public static readonly ErrorCode INVALID_DEPARTMENT =
        new(2103, "Department is invalid or inactive", HttpStatusCode.BadRequest);
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

    // =========================
    // Medicine / Inventory
    // =========================

    public static readonly ErrorCode MEDICINE_NOT_FOUND =
        new(
            6001,
            "Medicine not found",
            HttpStatusCode.NotFound
        );

    public static readonly ErrorCode MEDICINE_CATEGORY_NOT_FOUND =
        new(
            6002,
            "Medicine category not found",
            HttpStatusCode.NotFound
        );

    public static readonly ErrorCode SUPPLIER_NOT_FOUND =
        new(
            6003,
            "Supplier not found",
            HttpStatusCode.NotFound
        );

    public static readonly ErrorCode MEDICINE_NAME_EXISTED =
        new(
            6004,
            "Medicine name already exists",
            HttpStatusCode.Conflict
        );

    public static readonly ErrorCode MEDICINE_HAS_INVENTORY =
        new(
            6005,
            "Medicine already has inventory records",
            HttpStatusCode.Conflict
        );

    public static readonly ErrorCode MEDICINE_CATEGORY_NAME_EXISTED =
        new(
            6006,
            "Medicine category name already exists",
            HttpStatusCode.Conflict
        );

    public static readonly ErrorCode MEDICINE_CATEGORY_HAS_MEDICINES =
        new(
            6007,
            "Medicine category already has medicines",
            HttpStatusCode.Conflict
        );

    public static readonly ErrorCode SUPPLIER_NAME_EXISTED =
        new(
            6008,
            "Supplier name already exists",
            HttpStatusCode.Conflict
        );

    public static readonly ErrorCode SUPPLIER_HAS_MEDICINES =
        new(
            6009,
            "Supplier already has medicines",
            HttpStatusCode.Conflict
        );

    public static readonly ErrorCode INVENTORY_NOT_FOUND =
        new(
            6010,
            "Inventory batch not found",
            HttpStatusCode.NotFound
        );

    public static readonly ErrorCode INVENTORY_LOT_EXISTED =
        new(
            6011,
            "Inventory batch already exists for this medicine and expiry date",
            HttpStatusCode.Conflict
        );
}

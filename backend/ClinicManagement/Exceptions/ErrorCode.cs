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

    public static readonly ErrorCode SELF_ACCESS_CHANGE =
        new(2007, "You cannot lock your own account or change your own role", HttpStatusCode.Conflict);
    public static readonly ErrorCode LAST_ADMIN =
        new(2008, "At least one active administrator is required", HttpStatusCode.Conflict);
    public static readonly ErrorCode USER_ACCESS_CONFLICT =
        new(2009, "Account access changed concurrently. Reload and try again", HttpStatusCode.Conflict);
    public static readonly ErrorCode ROLE_NAME_EXISTS =
        new(2010, "Role name already exists", HttpStatusCode.Conflict);
    public static readonly ErrorCode SYSTEM_ROLE_PROTECTED =
        new(2011, "System role name and deletion are protected", HttpStatusCode.Conflict);
    public static readonly ErrorCode ROLE_IN_USE =
        new(2012, "Role is assigned to accounts", HttpStatusCode.Conflict);
    public static readonly ErrorCode ROLE_CONFLICT =
        new(2013, "Role changed concurrently. Reload and try again", HttpStatusCode.Conflict);
    public static readonly ErrorCode PERMISSION_NOT_FOUND =
        new(2014, "Unknown or unavailable permission code", HttpStatusCode.BadRequest);
    public static readonly ErrorCode ADMIN_PERMISSION_REQUIRED =
        new(2015, "Admin must retain RBAC management permissions", HttpStatusCode.Conflict);
    public static readonly ErrorCode ROLE_PERMISSION_NOT_ALLOWED =
        new(2016, "This permission is not valid for the system role", HttpStatusCode.BadRequest);

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

    public static readonly ErrorCode PATIENT_MATCH_REQUIRED =
        new(4002, "Existing patient must be matched before creating a new profile", HttpStatusCode.Conflict);
    public static readonly ErrorCode PATIENT_IDENTITY_MISMATCH =
        new(4003, "Patient identity does not match the appointment", HttpStatusCode.BadRequest);
    public static readonly ErrorCode BOOK_NOT_FOUND =
        new(4004, "Patient book not found", HttpStatusCode.NotFound);
    public static readonly ErrorCode BOOK_NOT_VERIFIED =
        new(4005, "An issued patient book must be verified before check-in", HttpStatusCode.BadRequest);
    public static readonly ErrorCode BOOK_CONFLICT =
        new(4006, "Book number or invoice has already been used", HttpStatusCode.Conflict);
    public static readonly ErrorCode BOOK_INVOICE_NOT_FOUND =
        new(4007, "Book invoice not found", HttpStatusCode.NotFound);
    public static readonly ErrorCode BOOK_INVOICE_INVALID_STATUS =
        new(4008, "Book invoice must be paid and not already used", HttpStatusCode.Conflict);

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
            "Inventory batch already exists for this medicine",
            HttpStatusCode.Conflict
        );

    public static readonly ErrorCode PURCHASE_ORDER_NOT_FOUND =
        new(6012, "Purchase order not found", HttpStatusCode.NotFound);

    public static readonly ErrorCode PURCHASE_ORDER_INVALID_STATUS =
        new(6013, "Only draft purchase orders can be changed", HttpStatusCode.Conflict);

    public static readonly ErrorCode PURCHASE_ORDER_INVALID_DETAILS =
        new(6014, "Purchase order details are invalid", HttpStatusCode.BadRequest);

    public static readonly ErrorCode PURCHASE_ORDER_DUPLICATE_BATCH =
        new(6015, "A medicine batch can appear only once in a purchase order", HttpStatusCode.Conflict);

    public static readonly ErrorCode INVENTORY_BATCH_EXPIRY_CONFLICT =
        new(6016, "The medicine batch already exists with a different expiry date", HttpStatusCode.Conflict);

    public static readonly ErrorCode PURCHASE_ORDER_EXPIRED_BATCH =
        new(6017, "Expired medicine batches cannot be received", HttpStatusCode.BadRequest);

    public static readonly ErrorCode PURCHASE_ORDER_SUPPLIER_MISMATCH =
        new(6018, "Purchase order medicines must belong to the selected supplier", HttpStatusCode.BadRequest);

    public static readonly ErrorCode INVENTORY_HAS_DISPENSE_HISTORY =
        new(6019, "Inventory batch has dispensing history and cannot be removed or reassigned", HttpStatusCode.Conflict);

    // =========================
    // Examination / Medical Record
    // =========================

    public static readonly ErrorCode DISEASE_NOT_FOUND =
        new(
            7001,
            "Disease not found",
            HttpStatusCode.NotFound
        );

    public static readonly ErrorCode DISEASE_CODE_EXISTED =
        new(
            7002,
            "Disease code already exists",
            HttpStatusCode.Conflict
        );

    public static readonly ErrorCode DISEASE_NAME_EXISTED =
        new(
            7003,
            "Disease name already exists",
            HttpStatusCode.Conflict
        );

    public static readonly ErrorCode DISEASE_HAS_DIAGNOSES =
        new(
            7004,
            "Disease already has medical record diagnoses",
            HttpStatusCode.Conflict
        );

    public static readonly ErrorCode DISEASE_INACTIVE =
        new(
            7005,
            "Disease is inactive",
            HttpStatusCode.BadRequest
        );

    public static readonly ErrorCode MEDICAL_RECORD_NOT_FOUND =
        new(
            7101,
            "Medical record not found",
            HttpStatusCode.NotFound
        );

    public static readonly ErrorCode MEDICAL_RECORD_EXISTED =
        new(
            7102,
            "Medical record already exists for this appointment",
            HttpStatusCode.Conflict
        );

    public static readonly ErrorCode PATIENT_BOOK_NOT_FOUND =
        new(7103, "Patient book not found", HttpStatusCode.NotFound);

    public static readonly ErrorCode PATIENT_BOOK_REQUIRED =
        new(7104, "Patient book is required before completing the examination", HttpStatusCode.BadRequest);

    public static readonly ErrorCode PAPER_BOOK_CONFIRMATION_REQUIRED =
        new(7105, "Paper book update confirmation is required before completing the examination", HttpStatusCode.BadRequest);

    public static readonly ErrorCode PATIENT_BOOK_INVALID_STATUS =
        new(7106, "Patient book status is invalid", HttpStatusCode.BadRequest);

    public static readonly ErrorCode LAB_TEST_NOT_FOUND =
        new(7201, "Lab test not found", HttpStatusCode.NotFound);
    public static readonly ErrorCode LAB_TEST_TYPE_NOT_FOUND =
        new(7202, "Lab test type not found or inactive", HttpStatusCode.NotFound);
    public static readonly ErrorCode LAB_TEST_CONFLICT =
        new(7203, "Lab test already has a result", HttpStatusCode.Conflict);
    public static readonly ErrorCode DOCTOR_SCHEDULE_CONFLICT =
        new(7301, "Doctor or room already has a schedule at this time", HttpStatusCode.Conflict);
    public static readonly ErrorCode SCHEDULE_REQUEST_NOT_FOUND =
        new(7302, "Schedule request not found", HttpStatusCode.NotFound);
    public static readonly ErrorCode SCHEDULE_REQUEST_INVALID_STATUS =
        new(7303, "Schedule request is no longer pending", HttpStatusCode.Conflict);

    public static readonly ErrorCode PRESCRIPTION_NOT_FOUND =
        new(7401, "Prescription not found", HttpStatusCode.NotFound);

    public static readonly ErrorCode PRESCRIPTION_EXISTED =
        new(7402, "Prescription already exists for this medical record", HttpStatusCode.Conflict);

    public static readonly ErrorCode PRESCRIPTION_INVALID_STATUS =
        new(7403, "Invalid prescription status", HttpStatusCode.BadRequest);

    public static readonly ErrorCode PRESCRIPTION_PAYMENT_REQUIRED =
        new(7404, "A paid medicine invoice is required before dispensing", HttpStatusCode.Conflict);

    public static readonly ErrorCode PRESCRIPTION_INSUFFICIENT_STOCK =
        new(7405, "Available non-expired stock is insufficient", HttpStatusCode.Conflict);

    public static readonly ErrorCode PRESCRIPTION_DISPENSE_CONFLICT =
        new(7406, "The prescription dispensing state changed; please reload and try again", HttpStatusCode.Conflict);
}

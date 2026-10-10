using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;
using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class MedicalRecordService : IMedicalRecordService
{
    private static DateTime ClinicNow =>
        TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
            DateTime.UtcNow,
            "Asia/Ho_Chi_Minh"
        );

    private readonly IMedicalRecordRepository _medicalRecordRepository;
    private readonly IDiseaseRepository _diseaseRepository;
    private readonly ApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notifications;

    public MedicalRecordService(
        IMedicalRecordRepository medicalRecordRepository,
        IDiseaseRepository diseaseRepository, ApplicationDbContext db,
        ICurrentUserService currentUser, INotificationService notifications)
    {
        _medicalRecordRepository = medicalRecordRepository;
        _diseaseRepository = diseaseRepository;
        _db = db;
        _currentUser = currentUser;
        _notifications = notifications;
    }

    public async Task<PagedResponse<ExaminationQueueResponse>> GetQueueAsync(
        ExaminationQueueFilterRequest request)
    {
        if (_currentUser.Role != RoleConstants.Admin)
            request.DoctorId = await AllowedDoctorIdAsync();
        var (items, totalItems) =
            await _medicalRecordRepository.GetQueueAsync(request);

        var responses = items
            .Select(x => x.ToQueueResponse())
            .ToList();

        return new PagedResponse<ExaminationQueueResponse>(
            responses,
            request.PageNumber,
            request.PageSize,
            totalItems
        );
    }

    public async Task<MedicalRecordResponse> GetByIdAsync(
        int medicalRecordId)
    {
        var record =
            await _medicalRecordRepository.GetByIdAsync(
                medicalRecordId
            );

        if (record == null)
        {
            throw new AppException(ErrorCode.MEDICAL_RECORD_NOT_FOUND);
        }

        await RequireRecordScopeAsync(record.DoctorId);

        return record.ToResponse();
    }

    public async Task<MedicalRecordResponse> GetByAppointmentIdAsync(
        int appointmentId)
    {
        var record =
            await _medicalRecordRepository.GetByAppointmentIdAsync(
                appointmentId
            );

        if (record == null)
        {
            throw new AppException(ErrorCode.MEDICAL_RECORD_NOT_FOUND);
        }

        await RequireRecordScopeAsync(record.DoctorId);

        return record.ToResponse();
    }

    public async Task<MedicalRecordResponse> CreateAsync(
        CreateMedicalRecordRequest request)
    {
        ValidateMedicalRecord(
            request.AppointmentId,
            request.Symptoms,
            request.Conclusion,
            request.Diagnoses,
            request.MarkCompleted
        );

        var appointment =
            await _medicalRecordRepository.GetAppointmentByIdAsync(
                request.AppointmentId
            );

        if (appointment == null)
        {
            throw new AppException(ErrorCode.APPOINTMENT_NOT_FOUND);
        }
        await RequireRecordScopeAsync(appointment.DoctorId);

        if (appointment.Status == AppointmentStatusConstants.Cancelled)
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_INVALID_STATUS
            );
        }

        if (!appointment.CheckedInAt.HasValue || !appointment.BookVerifiedAt.HasValue
            || !appointment.PatientBookId.HasValue)
            throw new AppException(ErrorCode.BOOK_NOT_VERIFIED);

        if (appointment.MedicalRecord != null)
        {
            throw new AppException(ErrorCode.MEDICAL_RECORD_EXISTED);
        }

        if (
            (appointment.Status == AppointmentStatusConstants.Pending ||
             appointment.Status == AppointmentStatusConstants.Confirmed) &&
            appointment.AppointmentDate.Date != ClinicNow.Date
        )
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_INVALID_STATUS
            );
        }

        var diagnoses =
            await BuildDiagnosesAsync(request.Diagnoses);

        var patientBook =
            await ResolvePatientBookAsync(
                request.PatientBookId,
                appointment.PatientBookId,
                null,
                request.MarkCompleted || request.PaperBookConfirmed
            );

        var paperBookUpdatedAt = ResolvePaperBookUpdatedAt(
            null,
            request.PaperBookConfirmed,
            request.MarkCompleted,
            patientBook?.PatientBookId
        );

        var record = new MedicalRecord
        {
            AppointmentId = appointment.AppointmentId,
            DoctorId = appointment.DoctorId,
            PatientId = appointment.PatientId,
            PatientBookId = patientBook?.PatientBookId,
            ExaminationDate = appointment.AppointmentDate.Date,
            Symptoms = request.Symptoms.Trim(),
            Conclusion = NormalizeOptionalText(request.Conclusion),
            PaperBookUpdatedAt = paperBookUpdatedAt,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Diagnoses = diagnoses
        };

        var previousStatus = appointment.Status;
        appointment.Status = request.MarkCompleted
            ? AppointmentStatusConstants.Completed
            : AppointmentStatusConstants.InProgress;

        await _medicalRecordRepository.AddAsync(record);
        await _medicalRecordRepository.SaveChangesAsync();
        if (previousStatus != appointment.Status)
            await _notifications.PublishAppointmentChangedAsync(appointment, appointment.Status);

        return await GetByIdAsync(record.MedicalRecordId);
    }

    public async Task<MedicalRecordResponse> UpdateAsync(
        int medicalRecordId,
        UpdateMedicalRecordRequest request)
    {
        ValidateMedicalRecord(
            medicalRecordId,
            request.Symptoms,
            request.Conclusion,
            request.Diagnoses,
            request.MarkCompleted
        );

        var record =
            await _medicalRecordRepository.GetByIdAsync(
                medicalRecordId
            );

        if (record == null)
        {
            throw new AppException(ErrorCode.MEDICAL_RECORD_NOT_FOUND);
        }
        await RequireRecordScopeAsync(record.DoctorId);

        var diagnoses =
            await BuildDiagnosesAsync(request.Diagnoses);

        var patientBook =
            await ResolvePatientBookAsync(
                request.PatientBookId,
                record.Appointment.PatientBookId,
                record.PatientBookId,
                request.MarkCompleted || request.PaperBookConfirmed
            );

        var paperBookUpdatedAt = ResolvePaperBookUpdatedAt(
            record.PaperBookUpdatedAt,
            request.PaperBookConfirmed,
            request.MarkCompleted,
            patientBook?.PatientBookId ?? record.PatientBookId
        );

        record.Symptoms = request.Symptoms.Trim();
        record.Conclusion = NormalizeOptionalText(request.Conclusion);
        record.PatientBookId =
            patientBook?.PatientBookId ?? record.PatientBookId;
        record.PaperBookUpdatedAt = paperBookUpdatedAt;
        record.UpdatedAt = DateTime.UtcNow;

        record.Diagnoses.Clear();
        foreach (var diagnosis in diagnoses)
        {
            record.Diagnoses.Add(diagnosis);
        }

        var previousStatus = record.Appointment.Status;
        record.Appointment.Status = request.MarkCompleted
            ? AppointmentStatusConstants.Completed
            : AppointmentStatusConstants.InProgress;

        await _medicalRecordRepository.SaveChangesAsync();
        if (previousStatus != record.Appointment.Status)
            await _notifications.PublishAppointmentChangedAsync(record.Appointment, record.Appointment.Status);

        return await GetByIdAsync(medicalRecordId);
    }

    private static void ValidateMedicalRecord(
        int id,
        string symptoms,
        string? conclusion,
        IReadOnlyCollection<SaveRecordDiagnosisRequest> diagnoses,
        bool markCompleted)
    {
        if (id <= 0 || string.IsNullOrWhiteSpace(symptoms))
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (markCompleted && diagnoses.Count == 0)
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (markCompleted && string.IsNullOrWhiteSpace(conclusion))
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (diagnoses.Count(x => x.IsPrimary) > 1)
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        var hasDuplicateDiseases =
            diagnoses
                .GroupBy(x => x.DiseaseId)
                .Any(x => x.Count() > 1);

        if (hasDuplicateDiseases)
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    private async Task<int?> AllowedDoctorIdAsync()
    {
        if (_currentUser.Role == RoleConstants.Admin) return null;
        var doctorId = await _db.Doctors.AsNoTracking()
            .Where(x => x.UserId == _currentUser.GetRequiredUserId() && x.IsActive)
            .Select(x => (int?)x.DoctorId).SingleOrDefaultAsync();
        if (!doctorId.HasValue) throw new AppException(ErrorCode.UNAUTHORIZED);
        return doctorId;
    }

    private async Task RequireRecordScopeAsync(int doctorId)
    {
        var allowedDoctorId = await AllowedDoctorIdAsync();
        if (allowedDoctorId.HasValue && allowedDoctorId.Value != doctorId)
            throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    private async Task<PatientBook?> ResolvePatientBookAsync(
        int? requestPatientBookId,
        int? appointmentPatientBookId,
        int? existingPatientBookId,
        bool required)
    {
        if (appointmentPatientBookId.HasValue &&
            requestPatientBookId.HasValue &&
            appointmentPatientBookId.Value != requestPatientBookId.Value)
        {
            throw new AppException(ErrorCode.PATIENT_BOOK_INVALID_STATUS);
        }

        var patientBookId =
            requestPatientBookId ??
            existingPatientBookId ??
            appointmentPatientBookId;

        if (!patientBookId.HasValue)
        {
            if (required)
            {
                throw new AppException(ErrorCode.PATIENT_BOOK_REQUIRED);
            }

            return null;
        }

        var patientBook = await _db.PatientBooks
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.PatientBookId == patientBookId.Value);

        if (patientBook == null)
        {
            throw new AppException(ErrorCode.PATIENT_BOOK_NOT_FOUND);
        }

        if (!string.Equals(
            patientBook.Status,
            PatientBookStatusConstants.Issued,
            StringComparison.OrdinalIgnoreCase))
        {
            if (required)
            {
                throw new AppException(
                    ErrorCode.PATIENT_BOOK_INVALID_STATUS
                );
            }

            return null;
        }

        return patientBook;
    }

    private static DateTime? ResolvePaperBookUpdatedAt(
        DateTime? currentPaperBookUpdatedAt,
        bool paperBookConfirmed,
        bool markCompleted,
        int? patientBookId)
    {
        if ((paperBookConfirmed || markCompleted) &&
            !patientBookId.HasValue)
        {
            throw new AppException(ErrorCode.PATIENT_BOOK_REQUIRED);
        }

        if (markCompleted &&
            !paperBookConfirmed &&
            !currentPaperBookUpdatedAt.HasValue)
        {
            throw new AppException(
                ErrorCode.PAPER_BOOK_CONFIRMATION_REQUIRED
            );
        }

        if (paperBookConfirmed &&
            !currentPaperBookUpdatedAt.HasValue)
        {
            return ClinicNow;
        }

        return currentPaperBookUpdatedAt;
    }

    private async Task<List<RecordDiagnosis>> BuildDiagnosesAsync(
        IReadOnlyCollection<SaveRecordDiagnosisRequest> requests)
    {
        var diagnoses = new List<RecordDiagnosis>();

        foreach (var request in requests)
        {
            if (request.DiseaseId <= 0)
            {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }

            var disease =
                await _diseaseRepository.GetByIdAsync(
                    request.DiseaseId
                );

            if (disease == null)
            {
                throw new AppException(ErrorCode.DISEASE_NOT_FOUND);
            }

            if (!disease.IsActive)
            {
                throw new AppException(ErrorCode.DISEASE_INACTIVE);
            }

            diagnoses.Add(new RecordDiagnosis
            {
                DiseaseId = request.DiseaseId,
                IsPrimary = request.IsPrimary,
                Note = NormalizeOptionalText(request.Note)
            });
        }

        if (diagnoses.Count > 0 &&
            !diagnoses.Any(x => x.IsPrimary))
        {
            diagnoses[0].IsPrimary = true;
        }

        return diagnoses;
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}

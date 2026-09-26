using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

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

    public MedicalRecordService(
        IMedicalRecordRepository medicalRecordRepository,
        IDiseaseRepository diseaseRepository)
    {
        _medicalRecordRepository = medicalRecordRepository;
        _diseaseRepository = diseaseRepository;
    }

    public async Task<PagedResponse<ExaminationQueueResponse>> GetQueueAsync(
        ExaminationQueueFilterRequest request)
    {
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

        return record.ToResponse();
    }

    public async Task<MedicalRecordResponse> CreateAsync(
        CreateMedicalRecordRequest request)
    {
        ValidateMedicalRecord(
            request.AppointmentId,
            request.Symptoms,
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

        if (appointment.Status == AppointmentStatusConstants.Cancelled)
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_INVALID_STATUS
            );
        }

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

        var record = new MedicalRecord
        {
            AppointmentId = appointment.AppointmentId,
            DoctorId = appointment.DoctorId,
            PatientId = appointment.PatientId,
            ExaminationDate = appointment.AppointmentDate.Date,
            Symptoms = request.Symptoms.Trim(),
            Conclusion = NormalizeOptionalText(request.Conclusion),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Diagnoses = diagnoses
        };

        appointment.Status = request.MarkCompleted
            ? AppointmentStatusConstants.Completed
            : AppointmentStatusConstants.InProgress;

        await _medicalRecordRepository.AddAsync(record);
        await _medicalRecordRepository.SaveChangesAsync();

        return await GetByIdAsync(record.MedicalRecordId);
    }

    public async Task<MedicalRecordResponse> UpdateAsync(
        int medicalRecordId,
        UpdateMedicalRecordRequest request)
    {
        ValidateMedicalRecord(
            medicalRecordId,
            request.Symptoms,
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

        var diagnoses =
            await BuildDiagnosesAsync(request.Diagnoses);

        record.Symptoms = request.Symptoms.Trim();
        record.Conclusion = NormalizeOptionalText(request.Conclusion);
        record.UpdatedAt = DateTime.UtcNow;

        record.Diagnoses.Clear();
        foreach (var diagnosis in diagnoses)
        {
            record.Diagnoses.Add(diagnosis);
        }

        record.Appointment.Status = request.MarkCompleted
            ? AppointmentStatusConstants.Completed
            : AppointmentStatusConstants.InProgress;

        await _medicalRecordRepository.SaveChangesAsync();

        return await GetByIdAsync(medicalRecordId);
    }

    private static void ValidateMedicalRecord(
        int id,
        string symptoms,
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

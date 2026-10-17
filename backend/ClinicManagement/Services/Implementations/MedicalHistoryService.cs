using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class MedicalHistoryService(
    IMedicalHistoryRepository repository, IPatientRepository patientRepository,
    ICurrentUserService currentUser) : IMedicalHistoryService
{
    public async Task<MedicalHistorySummaryResponse> GetSummaryAsync(int appointmentId)
    {
        var (source, patient) = await RequirePatientScopeAsync(appointmentId);
        var (totalVisits, totalDoctors, latestRecord) = await repository.GetSummaryAsync(patient);
        return patient.ToHistorySummary(source, totalVisits, totalDoctors, latestRecord);
    }

    public async Task<PagedResponse<MedicalHistoryListItemResponse>> GetHistoryAsync(
        int appointmentId, MedicalHistoryFilterRequest request)
    {
        var (_, patient) = await RequirePatientScopeAsync(appointmentId);
        return await GetHistoryForPatientAsync(patient, request);
    }

    public async Task<PatientMedicalHistorySummaryResponse> GetMySummaryAsync()
    {
        var patient = await RequireMyPatientAsync();
        var (totalVisits, _, latestRecord) = await repository.GetSummaryAsync(patient);
        var totalPrescriptions = await repository.GetPrescriptionCountAsync(patient);
        return patient.ToMyHistorySummary(totalVisits, totalPrescriptions, latestRecord);
    }

    public async Task<PagedResponse<MedicalHistoryListItemResponse>> GetMyHistoryAsync(
        MedicalHistoryFilterRequest request) =>
        await GetHistoryForPatientAsync(await RequireMyPatientAsync(), request);

    public async Task<MedicalHistoryDetailResponse> GetMyDetailAsync(int medicalRecordId)
    {
        var patient = await RequireMyPatientAsync();
        var record = await repository.GetHistoryDetailAsync(patient, medicalRecordId)
            ?? throw new AppException(ErrorCode.MEDICAL_RECORD_NOT_FOUND);
        var response = record.ToHistoryDetail(patient);
        if (record.Prescription != null)
        {
            var invoices = await repository.GetMedicineInvoicesAsync(patient, record);
            response.MedicineBilling = invoices.ToMedicineBilling(record.Prescription);
        }
        return response;
    }

    private async Task<PagedResponse<MedicalHistoryListItemResponse>> GetHistoryForPatientAsync(
        Patient patient, MedicalHistoryFilterRequest request)
    {
        if (request.FromDate.HasValue && request.ToDate.HasValue
            && request.FromDate.Value.Date > request.ToDate.Value.Date)
            throw new AppException(ErrorCode.INVALID_REQUEST,
                "Ngày bắt đầu không được sau ngày kết thúc.");

        var (items, totalItems) = await repository.GetHistoryAsync(patient, request);
        return new PagedResponse<MedicalHistoryListItemResponse>(
            items.Select(x => x.ToHistoryListItem()).ToList(),
            request.PageNumber, request.PageSize, totalItems);
    }

    public async Task<MedicalHistoryDetailResponse> GetDetailAsync(int appointmentId, int medicalRecordId)
    {
        var (_, patient) = await RequirePatientScopeAsync(appointmentId);
        return await GetDetailForPatientAsync(patient, medicalRecordId);
    }

    private async Task<MedicalHistoryDetailResponse> GetDetailForPatientAsync(Patient patient, int medicalRecordId)
    {
        var record = await repository.GetHistoryDetailAsync(patient, medicalRecordId)
            ?? throw new AppException(ErrorCode.MEDICAL_RECORD_NOT_FOUND);
        return record.ToHistoryDetail(patient);
    }

    private async Task<Patient> RequireMyPatientAsync() =>
        await patientRepository.GetByUserIdAsync(currentUser.GetRequiredUserId())
            ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND);

    private async Task<(Appointment Source, Patient Patient)> RequirePatientScopeAsync(int appointmentId)
    {
        var source = await repository.GetSourceAppointmentAsync(appointmentId)
            ?? throw new AppException(ErrorCode.APPOINTMENT_NOT_FOUND);
        if (currentUser.Role != RoleConstants.Admin)
        {
            var doctorId = await repository.GetDoctorIdAsync(currentUser.GetRequiredUserId());
            if (!doctorId.HasValue || source.DoctorId != doctorId.Value)
                throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (source.Status == AppointmentStatusConstants.Cancelled
            || !source.CheckedInAt.HasValue || !source.BookVerifiedAt.HasValue
            || !source.PatientBookId.HasValue)
            throw new AppException(ErrorCode.BOOK_NOT_VERIFIED);

        var patient = source.PatientProfile ?? source.PatientBook?.Patient
            ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND);
        if (source.PatientBook?.PatientId != patient.PatientId)
            throw new AppException(ErrorCode.BOOK_NOT_VERIFIED);
        return (source, patient);
    }
}

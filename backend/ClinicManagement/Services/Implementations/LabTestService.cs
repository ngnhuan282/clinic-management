using System.Data;
using ClinicManagement.DTOs.Requests.Laboratory;
using ClinicManagement.DTOs.Responses.Laboratory;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Exceptions;
using ClinicManagement.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services;

public class LabTestService(ApplicationDbContext context, INotificationService notifications) : ILabTestService
{
    public async Task<LabTestResponseDto> CreateLabTestAsync(int doctorId, CreateLabTestDto request)
{
    if (request.LabTestTypeId <= 0)
        throw new AppException(ErrorCode.INVALID_REQUEST);

    var labTestType = await context.LabTestTypes.AsNoTracking()
        .SingleOrDefaultAsync(x => x.Id == request.LabTestTypeId && x.IsActive)
        ?? throw new AppException(ErrorCode.LAB_TEST_TYPE_NOT_FOUND);

    var doctorEntity = await context.Doctors.AsNoTracking()
        .SingleOrDefaultAsync(d => d.UserId == doctorId && d.IsActive);

    bool IsAssignedToDoctor(int? appDoctorId) =>
        doctorEntity != null && appDoctorId == doctorEntity.DoctorId;

    Appointment? appointment = null;
    MedicalRecord? medicalRecord = null;

    if (request.MedicalRecordId is > 0)
    {
        medicalRecord = await context.MedicalRecords.AsNoTracking()
            .Include(m => m.Appointment)
            .SingleOrDefaultAsync(m => m.MedicalRecordId == request.MedicalRecordId.Value)
            ?? throw new AppException(ErrorCode.INVALID_REQUEST);

        if (!IsAssignedToDoctor(medicalRecord.DoctorId) && !IsAssignedToDoctor(medicalRecord.Appointment?.DoctorId))
            throw new AppException(ErrorCode.UNAUTHORIZED);

        appointment = medicalRecord.Appointment;
    }

    if (request.AppointmentId is > 0)
    {
        var appById = await context.Appointments.AsNoTracking()
            .SingleOrDefaultAsync(a => a.AppointmentId == request.AppointmentId.Value)
            ?? throw new AppException(ErrorCode.APPOINTMENT_NOT_FOUND);

        if (appById.Status == AppointmentStatusConstants.Cancelled)
            throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);

        if (!IsAssignedToDoctor(appById.DoctorId))
            throw new AppException(ErrorCode.UNAUTHORIZED);

        if (medicalRecord != null && medicalRecord.AppointmentId != appById.AppointmentId)
            throw new AppException(ErrorCode.INVALID_REQUEST);

        appointment = appById;
        medicalRecord ??= await context.MedicalRecords.AsNoTracking()
            .SingleOrDefaultAsync(m => m.AppointmentId == appById.AppointmentId);
    }

    if (appointment != null && (appointment.Status == AppointmentStatusConstants.Cancelled
        || (request.PatientProfileId.HasValue && request.PatientProfileId != appointment.PatientProfileId)
        || (request.PatientId.HasValue && request.PatientId != appointment.PatientId && request.PatientId != appointment.PatientProfileId)))
        throw new AppException(ErrorCode.INVALID_REQUEST);

    int? resolvedAppointmentId = appointment?.AppointmentId;
    int? resolvedMedicalRecordId = medicalRecord?.MedicalRecordId;
    int resolvedPatientId = 0;

    int? candidateUserId = appointment?.PatientId ?? medicalRecord?.PatientId;
    int? candidateProfileId = appointment?.PatientProfileId ?? request.PatientProfileId;

    if (candidateUserId is > 0)
    {
        var patientUser = await context.Users.AsNoTracking()
            .SingleOrDefaultAsync(x => x.UserId == candidateUserId.Value && x.Status && x.Role.RoleName == RoleConstants.Patient)
            ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND);
        resolvedPatientId = patientUser.UserId;
        candidateProfileId ??= await context.Patients.AsNoTracking()
            .Where(p => p.UserId == patientUser.UserId).Select(p => (int?)p.PatientId).SingleOrDefaultAsync();
    }
    else if (candidateProfileId is > 0)
    {
        var profile = await context.Patients.AsNoTracking()
            .SingleOrDefaultAsync(p => p.PatientId == candidateProfileId.Value)
            ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND);

        if (profile.UserId is > 0)
        {
            var patientUser = await context.Users.AsNoTracking()
                .SingleOrDefaultAsync(x => x.UserId == profile.UserId.Value && x.Status && x.Role.RoleName == RoleConstants.Patient)
                ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND);
            resolvedPatientId = patientUser.UserId;
        }
        else
        {
            resolvedPatientId = profile.PatientId;
        }
    }
    else if (request.PatientId is > 0)
    {
        var patientUser = await context.Users.AsNoTracking()
            .SingleOrDefaultAsync(x => x.UserId == request.PatientId.Value && x.Status && x.Role.RoleName == RoleConstants.Patient);

        if (patientUser != null)
        {
            resolvedPatientId = patientUser.UserId;
        }
        else
        {
            var profileById = await context.Patients.AsNoTracking()
                .SingleOrDefaultAsync(p => p.PatientId == request.PatientId.Value)
                ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND);

            resolvedPatientId = profileById.UserId ?? profileById.PatientId;
            candidateProfileId = profileById.PatientId;
        }
    }
    else if (!string.IsNullOrWhiteSpace(request.WalkInPatientName) && !string.IsNullOrWhiteSpace(request.WalkInPatientPhone))
    {
        var cleanName = request.WalkInPatientName.Trim();
        var cleanPhone = request.WalkInPatientPhone.Trim();

        var existingWalkIn = await context.Patients
            .FirstOrDefaultAsync(p => p.UserId == null && p.FullName == cleanName && p.Phone == cleanPhone);

        if (existingWalkIn == null)
        {
            existingWalkIn = new Patient
            {
                FullName = cleanName,
                Phone = cleanPhone,
                CreatedAt = DateTime.UtcNow
            };
            context.Patients.Add(existingWalkIn);
            await context.SaveChangesAsync();
        }

        resolvedPatientId = existingWalkIn.PatientId;
        candidateProfileId = existingWalkIn.PatientId;
    }
    else
    {
        throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    if (resolvedAppointmentId == null && resolvedPatientId > 0)
    {
        var profileIds = await context.Patients.AsNoTracking()
            .Where(p => candidateProfileId.HasValue ? p.PatientId == candidateProfileId.Value : p.UserId == resolvedPatientId)
            .Select(p => p.PatientId)
            .ToListAsync();

        var today = DateTime.UtcNow.AddHours(7).Date;
        var latestApp = await context.Appointments.AsNoTracking()
            .Where(a => a.Status != AppointmentStatusConstants.Cancelled
                && doctorEntity != null && a.DoctorId == doctorEntity.DoctorId
                && ((!candidateProfileId.HasValue && a.PatientId.HasValue && a.PatientId.Value == resolvedPatientId)
                    || (a.PatientProfileId.HasValue && profileIds.Contains(a.PatientProfileId.Value))))
            .OrderBy(a => Math.Abs(EF.Functions.DateDiffDay(a.AppointmentDate, today)))
            .ThenByDescending(a => a.AppointmentId)
            .FirstOrDefaultAsync();

        resolvedAppointmentId = latestApp?.AppointmentId;
        if (resolvedAppointmentId.HasValue && resolvedMedicalRecordId == null)
        {
            resolvedMedicalRecordId = await context.MedicalRecords.AsNoTracking()
                .Where(m => m.AppointmentId == resolvedAppointmentId.Value)
                .Select(m => (int?)m.MedicalRecordId)
                .FirstOrDefaultAsync();
        }
    }

    var test = new LabTest
    {
        AppointmentId = resolvedAppointmentId,
        MedicalRecordId = resolvedMedicalRecordId,
        DoctorId = doctorId,
        PatientId = resolvedPatientId,
        PatientProfileId = candidateProfileId,
        LabTestTypeId = request.LabTestTypeId,
        ClinicalDiagnosis = request.ClinicalDiagnosis?.Trim() ?? string.Empty,
        Status = "Pending",
        CreatedAt = DateTime.UtcNow
    };

    context.LabTests.Add(test);
    await context.SaveChangesAsync();

    var enriched = await EnrichLabTestsAsync([test]);
    
    return enriched.First();
}

    // IX.2 & IX.3: Kỹ thuật viên tiếp nhận chỉ định và bắt đầu thực hiện xét nghiệm
    public async Task<LabTestResponseDto> StartLabTestAsync(int labTestId, int technicianId)
    {
        if (labTestId <= 0)
            throw new AppException(ErrorCode.INVALID_REQUEST);

        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var test = await context.LabTests
            .Include(t => t.LabTestType)
            .Include(t => t.LabTestResult)
            .SingleOrDefaultAsync(x => x.Id == labTestId)
            ?? throw new AppException(ErrorCode.LAB_TEST_NOT_FOUND);

        // Chốt chặn thanh toán đủ trước khi tiếp nhận
        var isPaid = await IsLabTestPaidAsync(test.Id);
        if (!isPaid)
            throw new AppException(ErrorCode.LAB_RESULT_PAYMENT_GUARD);

        if (test.Status == "Completed" || test.Status == "Cancelled" || test.LabTestResult != null)
            throw new AppException(ErrorCode.LAB_TEST_CONFLICT);

        if (test.Status != "Pending")
            throw new AppException(ErrorCode.LAB_TEST_INVALID_STATUS);

        test.Status = "InProgress";
        test.ReceivedByTechnicianId = technicianId;
        test.StartedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
        await transaction.CommitAsync();

        var enriched = await EnrichLabTestsAsync([test]);
        return enriched.First();
    }

    // IX.3: Chặn gọi trực tiếp SubmitResult khi chưa thanh toán đủ (LAB_RESULT_PAYMENT_GUARD)
    public async Task<bool> SubmitResultAsync(int technicianId, CreateLabTestResultDto request)
    {
        if (request.LabTestId <= 0 || string.IsNullOrWhiteSpace(request.ResultSummary))
            throw new AppException(ErrorCode.INVALID_REQUEST);

        try
        {
            await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            var test = await context.LabTests.SingleOrDefaultAsync(x => x.Id == request.LabTestId)
                ?? throw new AppException(ErrorCode.LAB_TEST_NOT_FOUND);

            // Guard bắt buộc: kiểm tra hóa đơn đã Paid trước khi cho phép nhập kết quả
            var isPaid = await IsLabTestPaidAsync(test.Id);
            if (!isPaid)
                throw new AppException(ErrorCode.LAB_RESULT_PAYMENT_GUARD);

            if (test.Status is not ("Pending" or "InProgress") || await context.LabTestResults.AnyAsync(x => x.LabTestId == test.Id))
                throw new AppException(ErrorCode.LAB_TEST_CONFLICT);

            var now = DateTime.UtcNow;
            test.ReceivedByTechnicianId ??= technicianId;
            test.StartedAt ??= now;

            context.LabTestResults.Add(new LabTestResult
            {
                LabTestId = test.Id,
                TechnicianId = technicianId,
                ResultSummary = request.ResultSummary.Trim(),
                Note = request.Note?.Trim(),
                FileUrl = request.FileUrl?.Trim(),
                PerformedAt = now
            });

            test.Status = "Completed";

            var rows = await notifications.StageLabResultAsync(test);
            await context.SaveChangesAsync();
            await transaction.CommitAsync();

            await notifications.PublishAsync(rows);
            await notifications.PublishLabResultChangedAsync(test);
        }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new AppException(ErrorCode.LAB_TEST_CONFLICT);
        }
        catch (Exception error) when (IsDeadlock(error))
        {
            throw new AppException(ErrorCode.LAB_TEST_CONFLICT);
        }

        return true;
    }

    public async Task<LabTestResponseDto?> GetLabTestByIdAsync(int id, int currentUserId, string currentUserRole)
    {
        var tests = await (await VisibleToAsync(currentUserId))
            .Include(x => x.LabTestType)
            .Include(x => x.LabTestResult)
            .Where(x => x.Id == id)
            .ToListAsync();

        if (tests.Count == 0) return null;
        return (await EnrichLabTestsAsync(tests)).FirstOrDefault();
    }
public async Task<List<LabTestResponseDto>> GetPendingLabTestsAsync()
{
    var tests = await context.LabTests
        .AsNoTracking()
        .Include(x => x.LabTestType)
        .Include(x => x.LabTestResult)
        .Where(x => (x.Status == "Pending" || x.Status == "InProgress")
            && context.InvoiceDetails.Any(d => d.SourceType == "LabTest" && d.SourceId == x.Id
                && d.Invoice != null && d.Invoice.InvoiceType == "Standard" && d.Invoice.Status == "Paid"))
        .OrderByDescending(x => x.CreatedAt)
        .ToListAsync();

    return await EnrichLabTestsAsync(tests);
}
    public async Task<List<LabTestResponseDto>> GetLabTestsAsync(int currentUserId, string currentUserRole)
    {
        var tests = await (await VisibleToAsync(currentUserId))
            .Include(x => x.LabTestType)
            .Include(x => x.LabTestResult)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return await EnrichLabTestsAsync(tests);
    }

    private async Task<bool> IsLabTestPaidAsync(int labTestId) =>
        await context.InvoiceDetails
            .AsNoTracking()
            .AnyAsync(d => d.SourceType == "LabTest" &&
                           d.SourceId == labTestId &&
                           d.Invoice != null &&
                           d.Invoice.InvoiceType == "Standard" &&
                           d.Invoice.Status == "Paid");

    private async Task<List<LabTestResponseDto>> EnrichLabTestsAsync(List<LabTest> tests)
    {
        if (tests.Count == 0) return [];

        var testIds = tests.Select(t => t.Id).ToList();
        var patientIds = tests.Where(t => !t.PatientProfileId.HasValue).Select(t => t.PatientId).Distinct().ToList();
        var profileIds = tests.Where(t => t.PatientProfileId.HasValue).Select(t => t.PatientProfileId!.Value).Distinct().ToList();
        var doctorIds = tests.Select(t => t.DoctorId).Distinct().ToList();

        // Lấy trạng thái hóa đơn mới nhất của từng LabTest
        var invoiceLinks = await context.InvoiceDetails
            .AsNoTracking()
            .Where(d => d.SourceType == "LabTest" &&
                        testIds.Contains(d.SourceId) &&
                        d.Invoice != null &&
                        d.Invoice.InvoiceType == "Standard")
            .Select(d => new { d.SourceId, d.Invoice!.Status, d.Invoice.AppointmentId, d.InvoiceId })
            .ToListAsync();

        var paymentStatusByTestId = invoiceLinks
            .GroupBy(x => x.SourceId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(x => x.Status == "Paid").ThenByDescending(x => x.InvoiceId).First());

        // Lấy thông tin Bệnh nhân & Bác sĩ (hỗ trợ cả User và Patient profile)
        var users = await context.Users.AsNoTracking()
            .Where(u => patientIds.Contains(u.UserId) || doctorIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId);

        var patients = await context.Patients.AsNoTracking()
            .Where(p => profileIds.Contains(p.PatientId) || (p.UserId.HasValue && patientIds.Contains(p.UserId.Value)))
            .ToListAsync();

        var appointments = await context.Appointments.AsNoTracking()
            .Where(a => a.Status != AppointmentStatusConstants.Cancelled &&
                        ((a.PatientId.HasValue && patientIds.Contains(a.PatientId.Value)) ||
                         (a.PatientProfileId.HasValue && patientIds.Contains(a.PatientProfileId.Value))))
            .ToListAsync();

        return tests.Select(t =>
        {
            var patientProfile = t.PatientProfileId.HasValue
                ? patients.FirstOrDefault(p => p.PatientId == t.PatientProfileId)
                : patients.FirstOrDefault(p => p.UserId == t.PatientId);
            users.TryGetValue(t.PatientId, out var patientUser);
            users.TryGetValue(t.DoctorId, out var doctorUser);

            paymentStatusByTestId.TryGetValue(t.Id, out var invInfo);

            // Suy luận AppointmentId nếu dữ liệu cũ chưa lưu trực tiếp trên LabTest
            var resolvedAppId = t.AppointmentId ?? invInfo?.AppointmentId;
            if (resolvedAppId is null or <= 0)
            {
                var matchedApp = appointments
                    .Where(a => a.PatientId == t.PatientId ||
                                (patientProfile != null && a.PatientProfileId == patientProfile.PatientId))
                    .OrderBy(a => Math.Abs((a.AppointmentDate.Date - t.CreatedAt.Date).TotalDays))
                    .ThenByDescending(a => a.AppointmentId)
                    .FirstOrDefault();
                resolvedAppId = matchedApp?.AppointmentId;
            }

            return new LabTestResponseDto
            {
                Id = t.Id,
                AppointmentId = resolvedAppId,
                MedicalRecordId = t.MedicalRecordId,
                PatientId = t.PatientId,
                PatientName = patientProfile?.FullName ?? patientUser?.FullName ?? $"Bệnh nhân #{t.PatientId}",
                PatientPhone = patientProfile?.Phone ?? patientUser?.Phone ?? string.Empty,
                DoctorId = t.DoctorId,
                DoctorName = doctorUser?.FullName ?? $"Bác sĩ #{t.DoctorId}",
                LabTestTypeName = t.LabTestType?.Name ?? $"Loại #{t.LabTestTypeId}",
                Price = t.LabTestType?.Price ?? 0m,
                Status = t.Status,
                PaymentStatus = invInfo?.Status ?? "Unpaid",
                ClinicalDiagnosis = t.ClinicalDiagnosis,
                ReceivedByTechnicianId = t.ReceivedByTechnicianId,
                StartedAt = t.StartedAt,
                CreatedAt = t.CreatedAt,
                Result = t.LabTestResult == null ? null : new LabTestResultResponseDto
                {
                    Id = t.LabTestResult.Id,
                    TechnicianId = t.LabTestResult.TechnicianId,
                    ResultSummary = t.LabTestResult.ResultSummary,
                    Note = t.LabTestResult.Note,
                    FileUrl = t.LabTestResult.FileUrl,
                    PerformedAt = t.LabTestResult.PerformedAt
                }
            };
        }).ToList();
    }
//111//
    private static bool IsDeadlock(Exception error)
    {
        for (Exception? current = error; current != null; current = current.InnerException)
            if (current is SqlException { Number: 1205 }) return true;
        return false;
    }

    private async Task<IQueryable<LabTest>> VisibleToAsync(int userId)
    {
        var rights = await context.Users.AsNoTracking()
            .Where(x => x.UserId == userId)
            .SelectMany(x => x.Role.RolePermissions.Select(right => right.PermissionCode))
            .ToListAsync();

        var query = context.LabTests.AsNoTracking();
        if (await context.Users.AsNoTracking().AnyAsync(x => x.UserId == userId && x.Role.RoleName == RoleConstants.Admin))
            return query;

        if (rights.Contains(PermissionCodes.LabsViewPending))
            return query;

        var authored = rights.Contains(PermissionCodes.LabsOrder);
        var owned = rights.Contains(PermissionCodes.LabsViewOwnResult);
        return query.Where(x => (authored && x.DoctorId == userId) || (owned &&
            (x.PatientProfileId.HasValue
                ? context.Patients.Any(p => p.PatientId == x.PatientProfileId && p.UserId == userId)
                : x.PatientId == userId)));
    }
}

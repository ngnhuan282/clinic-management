using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.LabTests;
using ClinicManagement.DTOs.LabTestResults;
using ClinicManagement.Exceptions;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services;

public class LabTestService(ApplicationDbContext context) : ILabTestService
{
    public async Task<LabTestResponseDto> CreateLabTestAsync(int doctorId, CreateLabTestDto request)
    {
        if (request.PatientId <= 0 || request.LabTestTypeId <= 0)
            throw new AppException(ErrorCode.INVALID_REQUEST);

        var patientExists = await context.Users.AsNoTracking().AnyAsync(x =>
            x.UserId == request.PatientId && x.Status && x.Role.RoleName == RoleConstants.Patient);
        if (!patientExists) throw new AppException(ErrorCode.PATIENT_NOT_FOUND);

        var labTestType = await context.LabTestTypes.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == request.LabTestTypeId && x.IsActive);
        if (labTestType == null) throw new AppException(ErrorCode.LAB_TEST_TYPE_NOT_FOUND);

        var test = new LabTest
        {
            DoctorId = doctorId,
            PatientId = request.PatientId,
            LabTestTypeId = request.LabTestTypeId,
            ClinicalDiagnosis = request.ClinicalDiagnosis?.Trim() ?? string.Empty,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };
        context.LabTests.Add(test);
        await context.SaveChangesAsync();
        return new LabTestResponseDto
        {
            Id = test.Id,
            DoctorId = test.DoctorId,
            PatientId = test.PatientId,
            LabTestTypeName = labTestType.Name,
            Price = labTestType.Price,
            Status = test.Status,
            ClinicalDiagnosis = test.ClinicalDiagnosis,
            CreatedAt = test.CreatedAt
        };
    }

    public Task<List<LabTestResponseDto>> GetPendingLabTestsAsync() =>
        Project(context.LabTests.AsNoTracking().Where(x => x.Status == "Pending"))
            .OrderBy(x => x.CreatedAt).ToListAsync();

    public async Task<bool> SubmitResultAsync(int technicianId, CreateLabTestResultDto request)
    {
        if (request.LabTestId <= 0 || string.IsNullOrWhiteSpace(request.ResultSummary))
            throw new AppException(ErrorCode.INVALID_REQUEST);

        var test = await context.LabTests.SingleOrDefaultAsync(x => x.Id == request.LabTestId);
        if (test == null) throw new AppException(ErrorCode.LAB_TEST_NOT_FOUND);
        if (test.Status != "Pending" || await context.LabTestResults.AnyAsync(x => x.LabTestId == test.Id))
            throw new AppException(ErrorCode.LAB_TEST_CONFLICT);

        context.LabTestResults.Add(new LabTestResult
        {
            LabTestId = test.Id,
            TechnicianId = technicianId,
            ResultSummary = request.ResultSummary.Trim(),
            Note = request.Note?.Trim(),
            FileUrl = request.FileUrl?.Trim(),
            PerformedAt = DateTime.UtcNow
        });
        test.Status = "Completed";
        try { await context.SaveChangesAsync(); }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new AppException(ErrorCode.LAB_TEST_CONFLICT); }
        return true;
    }

    public Task<LabTestResponseDto?> GetLabTestByIdAsync(int id, int currentUserId, string currentUserRole) =>
        Project(VisibleTo(context.LabTests.AsNoTracking(), currentUserId, currentUserRole)
            .Where(x => x.Id == id)).SingleOrDefaultAsync();

    public Task<List<LabTestResponseDto>> GetLabTestsAsync(int currentUserId, string currentUserRole) =>
        Project(VisibleTo(context.LabTests.AsNoTracking(), currentUserId, currentUserRole))
            .OrderByDescending(x => x.CreatedAt).ToListAsync();

    private static IQueryable<LabTest> VisibleTo(IQueryable<LabTest> query, int userId, string role) => role switch
    {
        RoleConstants.Admin or RoleConstants.LabTechnician => query,
        RoleConstants.Doctor => query.Where(x => x.DoctorId == userId),
        RoleConstants.Patient => query.Where(x => x.PatientId == userId),
        _ => query.Where(_ => false)
    };

    private static IQueryable<LabTestResponseDto> Project(IQueryable<LabTest> query) =>
        query.Select(x => new LabTestResponseDto
        {
            Id = x.Id,
            PatientId = x.PatientId,
            DoctorId = x.DoctorId,
            LabTestTypeName = x.LabTestType!.Name,
            Price = x.LabTestType.Price,
            Status = x.Status,
            ClinicalDiagnosis = x.ClinicalDiagnosis,
            CreatedAt = x.CreatedAt,
            Result = x.LabTestResult == null ? null : new LabTestResultResponseDto
            {
                Id = x.LabTestResult.Id,
                TechnicianId = x.LabTestResult.TechnicianId,
                ResultSummary = x.LabTestResult.ResultSummary,
                Note = x.LabTestResult.Note,
                FileUrl = x.LabTestResult.FileUrl,
                PerformedAt = x.LabTestResult.PerformedAt
            }
        });
}

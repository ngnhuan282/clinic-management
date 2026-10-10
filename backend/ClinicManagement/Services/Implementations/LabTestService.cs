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

        var patientExists = await context.Users.AsNoTracking().AnyAsync(x => x.UserId == request.PatientId && x.Status && x.Role.RoleName == RoleConstants.Patient);
        if (!patientExists)
            throw new AppException(ErrorCode.PATIENT_NOT_FOUND);

        var labTestType = await context.LabTestTypes.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == request.LabTestTypeId && x.IsActive);
        if (labTestType == null)
            throw new AppException(ErrorCode.LAB_TEST_TYPE_NOT_FOUND);

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

    public async Task<List<LabTestResponseDto>> GetPendingListAsync()
    {
        // 1. Lấy tất cả ID xét nghiệm đã thanh toán thành công từ InvoiceDetails
        var paidLabTestIds = await context.InvoiceDetails
            .Where(d => d.SourceType == "LabTest")
            .Select(d => d.SourceId)
            .Distinct()
            .ToListAsync();

        // 2. Lọc các xét nghiệm Status == "Pending" VÀ thuộc danh sách ĐÃ THANH TOÁN
        var query = context.LabTests.AsNoTracking()
            .Where(l => l.Status == "Pending" && paidLabTestIds.Contains(l.Id));

        return await Project(query).OrderBy(x => x.CreatedAt).ToListAsync();
    }

    public async Task<List<LabTestResponseDto>> GetPendingLabTestsAsync()
    {
        // 1. Lấy tất cả ID xét nghiệm đã thanh toán thành công từ InvoiceDetails
        var paidLabTestIds = await context.InvoiceDetails
            .Where(d => d.SourceType == "LabTest")
            .Select(d => d.SourceId)
            .Distinct()
            .ToListAsync();

        // 2. Lọc các xét nghiệm Status == "Pending" VÀ thuộc danh sách ĐÃ THANH TOÁN
        var query = context.LabTests.AsNoTracking()
            .Where(x => x.Status == "Pending" && paidLabTestIds.Contains(x.Id));

        return await Project(query).OrderBy(x => x.CreatedAt).ToListAsync();
    }

    public async Task<bool> SubmitResultAsync(int technicianId, CreateLabTestResultDto request)
    {
        if (request.LabTestId <= 0 || string.IsNullOrWhiteSpace(request.ResultSummary))
            throw new AppException(ErrorCode.INVALID_REQUEST);

        var test = await context.LabTests.SingleOrDefaultAsync(x => x.Id == request.LabTestId);
        if (test == null)
            throw new AppException(ErrorCode.LAB_TEST_NOT_FOUND);

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

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new AppException(ErrorCode.LAB_TEST_CONFLICT);
        }

        return true;
    }

    public async Task<LabTestResponseDto?> GetLabTestByIdAsync(int id, int currentUserId, string currentUserRole)
        => await Project((await VisibleToAsync(currentUserId)).Where(x => x.Id == id)).SingleOrDefaultAsync();

    public async Task<List<LabTestResponseDto>> GetLabTestsAsync(int currentUserId, string currentUserRole)
        => await Project(await VisibleToAsync(currentUserId)).OrderByDescending(x => x.CreatedAt).ToListAsync();

    private async Task<IQueryable<LabTest>> VisibleToAsync(int userId)
    {
        var rights = await context.Users.AsNoTracking().Where(x => x.UserId == userId)
            .SelectMany(x => x.Role.RolePermissions.Select(right => right.PermissionCode)).ToListAsync();

        var query = context.LabTests.AsNoTracking();

        if (await context.Users.AsNoTracking().AnyAsync(x => x.UserId == userId && x.Role.RoleName == RoleConstants.Admin))
            return query;

        if (rights.Contains(PermissionCodes.LabsViewPending))
            return query;

        var authored = rights.Contains(PermissionCodes.LabsOrder);
        var owned = rights.Contains(PermissionCodes.LabsViewOwnResult);

        return query.Where(x => (authored && x.DoctorId == userId) || (owned && x.PatientId == userId));
    }

    private static IQueryable<LabTestResponseDto> Project(IQueryable<LabTest> query)
        => query.Select(x => new LabTestResponseDto
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
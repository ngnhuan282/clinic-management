using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.LabTests;
using ClinicManagement.DTOs;
using ClinicManagement.DTOs.LabTestResults;
namespace ClinicManagement.Services
{
    public class LabTestService : ILabTestService
    {
        private readonly ApplicationDbContext _context;

        public LabTestService(ApplicationDbContext context)
        {
            _context = context;
        }

       public async Task<LabTestResponseDto> CreateLabTestAsync(int doctorId, CreateLabTestDto dto)
{
    // 1. Kiểm tra loại xét nghiệm có tồn tại không
    var labTestType = await _context.LabTestTypes.FindAsync(dto.LabTestTypeId);
    if (labTestType == null)
    {
        throw new KeyNotFoundException($"Loại xét nghiệm có ID {dto.LabTestTypeId} không tồn tại.");
    }

    // // 2. Kiểm tra Bệnh nhân có tồn tại không (Thay Patients bằng DbSet tương ứng trong DbContext của bạn)
    // var patientExists = await _context.Patients.AnyAsync(p => p.Id == dto.PatientId);
    // if (!patientExists)
    // {
    //     throw new KeyNotFoundException($"Bệnh nhân có ID {dto.PatientId} không tồn tại.");
    // }

    // 3. Khởi tạo Entity
    var labTest = new LabTest
    {
        DoctorId = doctorId,
        PatientId = dto.PatientId,
        LabTestTypeId = dto.LabTestTypeId,
        ClinicalDiagnosis = dto.ClinicalDiagnosis ?? "",
        Status = "Pending",
        CreatedAt = DateTime.UtcNow // Nên dùng UtcNow thay vì Now để đồng bộ timezone
    };

    _context.LabTests.Add(labTest);
    await _context.SaveChangesAsync();

    // 4. Trả về kết quả
    return new LabTestResponseDto
    {
        Id = labTest.Id,
        PatientId = labTest.PatientId,
        DoctorId = labTest.DoctorId,
        LabTestTypeName = labTestType.Name,
        Price = labTestType.Price,
        Status = labTest.Status,
        ClinicalDiagnosis = labTest.ClinicalDiagnosis,
        CreatedAt = labTest.CreatedAt
    };
}

        public async Task<List<LabTestResponseDto>> GetPendingLabTestsAsync()
        {
            return await _context.LabTests
                .Include(x => x.LabTestType)
                .Where(x => x.Status == "Pending")
                .Select(x => new LabTestResponseDto
                {
                    Id = x.Id,
                    PatientId = x.PatientId,
                    DoctorId = x.DoctorId,
                    LabTestTypeName = x.LabTestType != null ? x.LabTestType.Name : "",
                    Price = x.LabTestType != null ? x.LabTestType.Price : 0,
                    Status = x.Status,
                    ClinicalDiagnosis = x.ClinicalDiagnosis,
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<bool> SubmitResultAsync(int technicianId, CreateLabTestResultDto dto)
        {
            var test = await _context.LabTests.FindAsync(dto.LabTestId);
            if (test == null) return false;

            var result = new LabTestResult
            {
                LabTestId = dto.LabTestId,
                TechnicianId = technicianId,
                ResultSummary = dto.ResultSummary,
                Note = dto.Note,
                FileUrl = dto.FileUrl,
                PerformedAt = DateTime.Now
            };

            test.Status = "Completed";
            _context.LabTestResults.Add(result);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<LabTestResponseDto?> GetLabTestByIdAsync(int id, int currentUserId, string currentUserRole)
        {
            var test = await _context.LabTests
                .Include(x => x.LabTestType)
                .Include(x => x.LabTestResult)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (test == null) return null;

            // Kiểm tra phân quyền: Nếu là Patient thì chỉ được xem bản ghi của chính mình
            if (currentUserRole == "Patient" && test.PatientId != currentUserId)
            {
                return null;
            }

            return new LabTestResponseDto
            {
                Id = test.Id,
                PatientId = test.PatientId,
                DoctorId = test.DoctorId,
                LabTestTypeName = test.LabTestType?.Name ?? "",
                Price = test.LabTestType?.Price ?? 0,
                Status = test.Status,
                ClinicalDiagnosis = test.ClinicalDiagnosis,
                CreatedAt = test.CreatedAt,
                Result = test.LabTestResult == null ? null : new LabTestResultResponseDto
                {
                    Id = test.LabTestResult.Id,
                    TechnicianId = test.LabTestResult.TechnicianId,
                    ResultSummary = test.LabTestResult.ResultSummary,
                    Note = test.LabTestResult.Note,
                    FileUrl = test.LabTestResult.FileUrl,
                    PerformedAt = test.LabTestResult.PerformedAt
                }
            };
        }


public async Task<List<LabTestResponseDto>> GetAllLabTestsAsync()
{
    return await _context.LabTests
        .AsNoTracking()
        .OrderByDescending(x => x.CreatedAt)
        .Select(x => new LabTestResponseDto
        {
            Id = x.Id,
            PatientId = x.PatientId,
            DoctorId = x.DoctorId,
            LabTestTypeName = x.LabTestType != null ? x.LabTestType.Name : "",
            Price = x.LabTestType != null ? x.LabTestType.Price : 0,
            Status = x.Status ?? "Pending",
            ClinicalDiagnosis = x.ClinicalDiagnosis ?? "",
            CreatedAt = x.CreatedAt,
            Result = x.LabTestResult == null ? null : new LabTestResultResponseDto
            {
                Id = x.LabTestResult.Id,
                TechnicianId = x.LabTestResult.TechnicianId,
                ResultSummary = x.LabTestResult.ResultSummary ?? "",
                Note = x.LabTestResult.Note,
                FileUrl = x.LabTestResult.FileUrl,
                PerformedAt = x.LabTestResult.PerformedAt
            }
        })
        .ToListAsync();
}
        private async Task<LabTestResponseDto> GetLabTestResponseDto(int id)
        {
            return (await GetLabTestByIdAsync(id, 0, "Admin"))!;
        }
    }
}
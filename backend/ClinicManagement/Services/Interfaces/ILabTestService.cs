using System.Collections.Generic;
using System.Threading.Tasks;
using ClinicManagement.DTOs.LabTests;
using ClinicManagement.DTOs.LabTestResults;
using ClinicManagement.DTOs;

namespace ClinicManagement.Services
{
    public interface ILabTestService
    {
        Task<List<LabTestResponseDto>> GetAllLabTestsAsync();
        Task<LabTestResponseDto> CreateLabTestAsync(int doctorId, CreateLabTestDto dto);
        Task<List<LabTestResponseDto>> GetPendingLabTestsAsync();
        Task<bool> SubmitResultAsync(int technicianId, CreateLabTestResultDto dto);
        Task<LabTestResponseDto?> GetLabTestByIdAsync(int id, int currentUserId, string currentUserRole);
    }
}   
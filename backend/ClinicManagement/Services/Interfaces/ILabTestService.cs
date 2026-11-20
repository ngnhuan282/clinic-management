using ClinicManagement.DTOs.Requests.Laboratory;
using ClinicManagement.DTOs.Responses.Laboratory;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ClinicManagement.Services
{
    public interface ILabTestService
    {
        Task<List<LabTestResponseDto>> GetLabTestsAsync(int currentUserId, string currentUserRole);
        Task<LabTestResponseDto> CreateLabTestAsync(int doctorId, CreateLabTestDto dto);
        Task<List<LabTestResponseDto>> GetPendingLabTestsAsync();
        Task<LabTestResponseDto> StartLabTestAsync(int labTestId, int technicianId);
        Task<bool> SubmitResultAsync(int technicianId, CreateLabTestResultDto dto);
        Task<LabTestResponseDto?> GetLabTestByIdAsync(int id, int currentUserId, string currentUserRole);
    }
}
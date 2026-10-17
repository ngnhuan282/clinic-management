using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IDoctorScheduleService
{
    Task<DoctorScheduleResponse> CreateScheduleAsync(CreateDoctorScheduleRequest request);
    Task<ScheduleRequestResponse> CreateRequestAsync(CreateDoctorScheduleRequest request);
    Task<List<ScheduleRequestResponse>> GetMyRequestsAsync();
    Task<List<RoomResponse>> GetAvailableRoomsAsync();
    Task<List<DoctorScheduleResponse>> GetSchedulesAsync(DateOnly? date, DateOnly? weekStart, int? specializationId, int? doctorId = null, int? roomId = null);
    Task<DoctorScheduleResponse> GetByIdAsync(Guid id);
    Task<List<AvailableSlotResponse>> GetAvailableSlotsAsync(int doctorId, int? specializationId, DateOnly date);
}

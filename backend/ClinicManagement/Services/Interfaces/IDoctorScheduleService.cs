using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IDoctorScheduleService
{
    Task<DoctorScheduleResponse> CreateScheduleAsync(CreateDoctorScheduleRequest request);
    Task<ScheduleRequestResponse> CreateRequestAsync(CreateDoctorScheduleRequest request);
    Task<List<ScheduleRequestResponse>> GetMyRequestsAsync();
    Task<List<RoomResponse>> GetAvailableRoomsAsync();
    Task<PagedResponse<DoctorScheduleResponse>> GetSchedulesAsync(DoctorScheduleQuery query);
    Task<DoctorScheduleResponse> GetByIdAsync(Guid id);
    Task<List<AvailableSlotResponse>> GetAvailableSlotsAsync(int doctorId, int? specializationId, DateOnly date);
}

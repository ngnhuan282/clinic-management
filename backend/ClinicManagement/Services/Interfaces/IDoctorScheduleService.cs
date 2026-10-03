using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IDoctorScheduleService
{
    Task<DoctorScheduleResponse> CreateScheduleAsync(CreateDoctorScheduleRequest request);
    Task<ScheduleRequestResponse> CreateRequestAsync(CreateDoctorScheduleRequest request);
    Task<List<ScheduleRequestResponse>> GetMyRequestsAsync();
    Task<List<RoomResponse>> GetAvailableRoomsAsync();
    Task<List<DoctorScheduleResponse>> GetSchedulesAsync(DateOnly? date, DateOnly? weekStart, int? specializationId);
    Task<List<AvailableSlotResponse>> GetAvailableSlotsAsync(int doctorId, int? specializationId, DateOnly date);
}

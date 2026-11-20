using ClinicManagement.DTOs.Requests.Schedules;
using ClinicManagement.DTOs.Responses.Appointments;
using ClinicManagement.DTOs.Responses.Catalog;
using ClinicManagement.DTOs.Responses.Schedules;
using ClinicManagement.DTOs.Responses.Shared;


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
    Task<DoctorScheduleResponse> UpdateScheduleAsync(Guid id, UpdateDoctorScheduleRequest request);
    Task DeleteScheduleAsync(Guid id);
}

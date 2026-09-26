using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IBookingService
{
    Task<PagedResponse<AppointmentResponse>> GetAppointmentsAsync(
        AppointmentQuery query);

    Task<List<DepartmentResponse>> GetDepartmentsAsync();

    Task<List<DoctorResponse>> GetDoctorsByDepartmentAsync(
        int departmentId);

    Task<List<AvailableSlotResponse>> GetAvailableSlotsAsync(
        int doctorId,
        DateTime appointmentDate);

    Task<AppointmentResponse> CreateAppointmentAsync(
        CreateAppointmentRequest request);

    Task<AppointmentResponse> CreateDirectAppointmentAsync(
        CreateAppointmentRequest request);

    Task<AppointmentResponse> ConfirmAppointmentAsync(
        int appointmentId);

    Task<AppointmentResponse> RescheduleAppointmentAsync(
        int appointmentId,
        RescheduleAppointmentRequest request);

    Task<AppointmentResponse> CancelAppointmentAsync(
        int appointmentId);

    Task<AppointmentResponse> StartExaminationAsync(
        int appointmentId);
}
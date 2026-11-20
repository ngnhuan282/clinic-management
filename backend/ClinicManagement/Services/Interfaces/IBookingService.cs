using ClinicManagement.DTOs.Requests.Appointments;
using ClinicManagement.DTOs.Responses.Appointments;
using ClinicManagement.DTOs.Responses.Catalog;
using ClinicManagement.DTOs.Responses.Doctors;
using ClinicManagement.DTOs.Responses.Shared;


namespace ClinicManagement.Services.Interfaces;

public interface IBookingService
{
    Task<PagedResponse<AppointmentResponse>> GetAppointmentsAsync(
        AppointmentQuery query);

    Task<PagedResponse<AppointmentResponse>> GetMyAppointmentsAsync(
        AppointmentQuery query);

    Task<List<DepartmentResponse>> GetDepartmentsAsync();

    Task<List<DoctorResponse>> GetDoctorsByDepartmentAsync(
        int departmentId);

    Task<List<AvailableSlotResponse>> GetAvailableSlotsAsync(
        int doctorId,
        DateTime appointmentDate);

    Task<AppointmentResponse> CreateAppointmentAsync(
        CreateAppointmentRequest request);

    Task<AppointmentResponse> CreateGuestAppointmentAsync(
        CreateAppointmentRequest request);

    Task<AppointmentResponse> CreateDirectAppointmentAsync(
        CreateDirectAppointmentRequest request);

    Task<AppointmentResponse> ConfirmAppointmentAsync(
        int appointmentId);

    Task<AppointmentResponse> RescheduleAppointmentAsync(
        int appointmentId,
        RescheduleAppointmentRequest request);

    Task<AppointmentResponse> CancelAppointmentAsync(
        int appointmentId);

    Task<AppointmentResponse> CancelMyAppointmentAsync(int appointmentId);

    Task<AppointmentResponse> StartExaminationAsync(
        int appointmentId);
}

using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IBookingService
{
    Task<List<DepartmentResponse>> GetDepartmentsAsync();

    Task<List<DoctorResponse>> GetDoctorsByDepartmentAsync(
        int departmentId);

    Task<List<AvailableSlotResponse>> GetAvailableSlotsAsync(
        int doctorId,
        DateTime appointmentDate);

    Task<AppointmentResponse> CreateAppointmentAsync(
        CreateAppointmentRequest request);

    Task<AppointmentResponse> StartExaminationAsync(
        int appointmentId);
}

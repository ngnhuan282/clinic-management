using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;

namespace ClinicManagement.Repositories.Interfaces;

public interface IMedicalRecordRepository
{
    Task<(IEnumerable<Appointment> Items, int TotalItems)> GetQueueAsync(
        ExaminationQueueFilterRequest request);

    Task<Appointment?> GetAppointmentByIdAsync(int appointmentId);

    Task<MedicalRecord?> GetByIdAsync(int medicalRecordId);

    Task<MedicalRecord?> GetByAppointmentIdAsync(int appointmentId);

    Task AddAsync(MedicalRecord medicalRecord);

    Task SaveChangesAsync();
}

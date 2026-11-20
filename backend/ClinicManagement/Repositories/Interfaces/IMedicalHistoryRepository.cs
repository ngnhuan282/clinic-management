using ClinicManagement.DTOs.Requests.MedicalHistory;
using ClinicManagement.Data.Entities;

namespace ClinicManagement.Repositories.Interfaces;

public interface IMedicalHistoryRepository
{
    Task<Appointment?> GetSourceAppointmentAsync(int appointmentId);
    Task<int?> GetDoctorIdAsync(int userId);
    Task<(int TotalVisits, int TotalDoctors, MedicalRecord? LatestRecord)> GetSummaryAsync(Patient patient);
    Task<int> GetPrescriptionCountAsync(Patient patient);
    Task<(IReadOnlyList<MedicalRecord> Items, int TotalItems)> GetHistoryAsync(
        Patient patient, MedicalHistoryFilterRequest request);
    Task<MedicalRecord?> GetHistoryDetailAsync(Patient patient, int medicalRecordId);
    Task<IReadOnlyList<Invoice>> GetMedicineInvoicesAsync(Patient patient, MedicalRecord record);
}

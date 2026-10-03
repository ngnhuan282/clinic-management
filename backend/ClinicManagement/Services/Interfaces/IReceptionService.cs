using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Services.Interfaces;

public interface IReceptionService
{
    Task<List<PatientMatchResponse>> FindPatientsAsync(string search);
    Task<AppointmentResponse> MatchAppointmentPatientAsync(int appointmentId, int? patientProfileId);
    Task<List<PatientBookResponse>> GetBooksAsync(int patientId);
    Task<PatientBookResponse> RegisterExistingBookAsync(int patientId, RegisterExistingBookRequest request);
    Task<List<BookInvoiceResponse>> GetBookInvoicesAsync(int patientId);
    Task<BookInvoiceResponse> CreateBookInvoiceAsync(int patientId, CreateBookInvoiceRequest request);
    Task<BookInvoiceResponse> MarkBookInvoicePaidAsync(int invoiceId);
    Task<PatientBookResponse> IssueBookAsync(int invoiceId, string bookNumber);
    Task<AppointmentResponse> CheckInAsync(int appointmentId, CheckInAppointmentRequest request);
}

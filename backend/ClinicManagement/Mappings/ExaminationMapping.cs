using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Mappings;

public static class ExaminationMapping
{
    public static DiseaseResponse ToResponse(this Disease disease)
    {
        return new DiseaseResponse
        {
            DiseaseId = disease.DiseaseId,
            DiseaseCode = disease.DiseaseCode,
            DiseaseName = disease.DiseaseName,
            Description = disease.Description,
            IsActive = disease.IsActive,
            CreatedAt = disease.CreatedAt
        };
    }

    public static DiseaseOptionResponse ToOptionResponse(
        this Disease disease)
    {
        return new DiseaseOptionResponse
        {
            DiseaseId = disease.DiseaseId,
            DiseaseCode = disease.DiseaseCode,
            DiseaseName = disease.DiseaseName
        };
    }

    public static ExaminationQueueResponse ToQueueResponse(
        this Appointment appointment)
    {
        return new ExaminationQueueResponse
        {
            AppointmentId = appointment.AppointmentId,
            DoctorId = appointment.DoctorId,
            DoctorName = appointment.Doctor.FullName,
            PatientId = appointment.PatientId,
            PatientName = appointment.PatientName,
            PatientPhone = appointment.PatientPhone,
            AppointmentDate = appointment.AppointmentDate,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Reason = appointment.Reason,
            Status = appointment.Status,
            MedicalRecordId = appointment.MedicalRecord?.MedicalRecordId
        };
    }

    public static MedicalRecordResponse ToResponse(
        this MedicalRecord record)
    {
        return new MedicalRecordResponse
        {
            MedicalRecordId = record.MedicalRecordId,
            AppointmentId = record.AppointmentId,
            DoctorId = record.DoctorId,
            DoctorName = record.Doctor.FullName,
            PatientId = record.PatientId,
            PatientName = record.Appointment.PatientName,
            PatientPhone = record.Appointment.PatientPhone,
            AppointmentDate = record.Appointment.AppointmentDate,
            StartTime = record.Appointment.StartTime,
            Symptoms = record.Symptoms,
            Conclusion = record.Conclusion,
            Status = record.Appointment.Status,
            CreatedAt = record.CreatedAt,
            UpdatedAt = record.UpdatedAt,
            Diagnoses = record.Diagnoses
                .OrderByDescending(x => x.IsPrimary)
                .ThenBy(x => x.Disease.DiseaseName)
                .Select(x => new RecordDiagnosisResponse
                {
                    RecordDiagnosisId = x.RecordDiagnosisId,
                    DiseaseId = x.DiseaseId,
                    DiseaseCode = x.Disease.DiseaseCode,
                    DiseaseName = x.Disease.DiseaseName,
                    IsPrimary = x.IsPrimary,
                    Note = x.Note
                })
                .ToList()
        };
    }
}

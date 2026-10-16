using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Mappings;

public static class MedicalHistoryMapping
{
    public static MedicalHistorySummaryResponse ToHistorySummary(
        this Patient patient, Appointment source, int totalVisits, int totalDoctors,
        MedicalRecord? latestRecord) => new()
        {
            PatientId = patient.PatientId,
            PatientCode = $"BN-{patient.PatientId:D5}",
            PatientName = patient.FullName,
            PatientPhone = patient.Phone,
            BirthDate = patient.BirthDate,
            PatientBookNumber = source.PatientBook?.BookNumber,
            TotalCompletedVisits = totalVisits,
            TotalDoctors = totalDoctors,
            LatestExaminationDate = latestRecord?.ExaminationDate,
            LatestMedicalRecordId = latestRecord?.MedicalRecordId
        };

    public static PatientMedicalHistorySummaryResponse ToMyHistorySummary(
        this Patient patient, int totalVisits, int totalPrescriptions, MedicalRecord? latestRecord) => new()
        {
            PatientCode = $"BN-{patient.PatientId:D5}",
            PatientName = patient.FullName,
            PatientPhone = patient.Phone,
            BirthDate = patient.BirthDate,
            TotalCompletedVisits = totalVisits,
            TotalPrescriptions = totalPrescriptions,
            LatestExaminationDate = latestRecord?.ExaminationDate,
            LatestMedicalRecordId = latestRecord?.MedicalRecordId
        };

    public static MedicalHistoryListItemResponse ToHistoryListItem(this MedicalRecord record) => new()
    {
        MedicalRecordId = record.MedicalRecordId,
        AppointmentId = record.AppointmentId,
        ExaminationDate = record.ExaminationDate,
        StartTime = record.Appointment.StartTime,
        DoctorName = record.Doctor.FullName,
        DepartmentName = record.Doctor.Department.Name,
        Diagnoses = record.ToResponse().Diagnoses,
        PrescriptionStatus = record.Prescription?.Status,
        PrescriptionItemCount = record.Prescription?.Details.Count ?? 0,
        MedicineNames = record.Prescription?.Details
            .OrderBy(x => x.PrescriptionDetailId)
            .Take(2).Select(x => x.Medicine.MedicineName).ToList() ?? []
    };

    public static MedicalHistoryDetailResponse ToHistoryDetail(this MedicalRecord record, Patient patient) => new()
    {
        PatientCode = $"BN-{patient.PatientId:D5}",
        DepartmentName = record.Doctor.Department.Name,
        Record = record.ToResponse(),
        Prescription = record.Prescription == null ? null : new MedicalHistoryPrescriptionResponse
        {
            PrescriptionCode = $"RX-{record.Prescription.PrescriptionId:D5}",
            PrescriptionDate = record.Prescription.PrescriptionDate,
            Status = record.Prescription.Status,
            DispensedAt = record.Prescription.DispensedAt,
            Notes = record.Prescription.Notes,
            Details = record.Prescription.Details.OrderBy(x => x.PrescriptionDetailId)
                .Select(x => new MedicalHistoryMedicineResponse
                {
                    PrescriptionDetailId = x.PrescriptionDetailId,
                    MedicineCode = $"MED-{x.MedicineId:D5}",
                    MedicineName = x.Medicine.MedicineName,
                    Unit = x.Medicine.Unit,
                    Quantity = x.Quantity,
                    Dosage = x.Dosage,
                    Instructions = x.Instructions
                }).ToList()
        }
    };

    public static PatientMedicineBillingResponse ToMedicineBilling(
        this IReadOnlyList<Invoice> invoices, Prescription prescription)
    {
        var detailIds = prescription.Details.Select(x => x.PrescriptionDetailId).ToHashSet();
        bool IsMedicine(InvoiceDetail line) =>
            (line.SourceType == "Prescription" && line.SourceId == prescription.PrescriptionId)
            || (line.SourceType == "PrescriptionDetail" && detailIds.Contains(line.SourceId));
        var items = invoices.Select(invoice =>
        {
            // Older invoices may lack the insurance split; do not present missing values as zero paid.
            var hasFinancialSplit = invoice.InsuranceAmount >= 0 && invoice.PatientAmount >= 0
                && invoice.InsuranceAmount + invoice.PatientAmount == invoice.TotalAmount;
            return new PatientMedicineInvoiceResponse
            {
                InvoiceId = invoice.Id,
                BillingStage = invoice.BillingStage,
                Status = invoice.Status,
                CreatedAt = invoice.CreatedAt,
                PaymentMethod = invoice.PaymentMethod,
                MedicineAmount = invoice.InvoiceDetails.Where(IsMedicine).Sum(x => x.TotalPrice),
                TotalAmount = invoice.TotalAmount,
                InsuranceAmount = hasFinancialSplit ? invoice.InsuranceAmount : null,
                PatientAmount = hasFinancialSplit ? invoice.PatientAmount : null,
                Details = invoice.InvoiceDetails.OrderBy(x => x.Id).Select(line => new PatientMedicineInvoiceItemResponse
                {
                    InvoiceDetailId = line.Id,
                    ItemName = line.ItemName,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    TotalPrice = line.TotalPrice,
                    IsPrescriptionMedicine = IsMedicine(line)
                }).ToList()
            };
        }).ToList();
        return new PatientMedicineBillingResponse
        {
            TotalMedicineAmount = items.Count == 0 ? null : items.Sum(x => x.MedicineAmount),
            Invoices = items
        };
    }
}

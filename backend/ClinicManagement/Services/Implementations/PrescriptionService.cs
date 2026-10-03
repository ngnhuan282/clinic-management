using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class PrescriptionService : IPrescriptionService
{
    private static DateTime ClinicNow =>
        TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
            DateTime.UtcNow,
            "Asia/Ho_Chi_Minh"
        );

    private readonly IPrescriptionRepository _prescriptionRepository;
    private readonly ApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public PrescriptionService(
        IPrescriptionRepository prescriptionRepository,
        ApplicationDbContext db,
        ICurrentUserService currentUser)
    {
        _prescriptionRepository = prescriptionRepository;
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<PrescriptionResponse> GetByIdAsync(
        int prescriptionId)
    {
        var prescription =
            await _prescriptionRepository.GetByIdAsync(
                prescriptionId
            );

        if (prescription == null)
        {
            throw new AppException(ErrorCode.PRESCRIPTION_NOT_FOUND);
        }

        await RequireRecordScopeAsync(
            prescription.MedicalRecord.DoctorId
        );

        return prescription.ToResponse(GetClinicToday());
    }

    public async Task<PrescriptionResponse?> GetByMedicalRecordIdAsync(
        int medicalRecordId)
    {
        var record =
            await _prescriptionRepository.GetMedicalRecordByIdAsync(
                medicalRecordId
            );

        if (record == null)
        {
            throw new AppException(ErrorCode.MEDICAL_RECORD_NOT_FOUND);
        }

        await RequireRecordScopeAsync(record.DoctorId);

        var prescription =
            await _prescriptionRepository.GetByMedicalRecordIdAsync(
                medicalRecordId
            );

        if (prescription == null)
        {
            return null;
        }

        if (prescription.Status == PrescriptionStatusConstants.Cancelled)
        {
            return null;
        }

        return prescription.ToResponse(GetClinicToday());
    }

    public async Task<IReadOnlyList<PrescriptionMedicineOptionResponse>>
        GetMedicineOptionsAsync()
    {
        var medicines =
            await _prescriptionRepository.GetMedicineOptionsAsync();

        var today = GetClinicToday();

        return medicines
            .Select(x => x.ToPrescriptionOptionResponse(today))
            .ToList();
    }

    public async Task<PrescriptionResponse> CreateAsync(
        CreatePrescriptionRequest request)
    {
        ValidatePrescription(
            request.MedicalRecordId,
            request.Details
        );

        var record =
            await _prescriptionRepository.GetMedicalRecordByIdAsync(
                request.MedicalRecordId
            );

        if (record == null)
        {
            throw new AppException(ErrorCode.MEDICAL_RECORD_NOT_FOUND);
        }

        await RequireRecordScopeAsync(record.DoctorId);
        EnsureRecordCanBePrescribed(record);

        if (record.Prescription != null &&
            record.Prescription.Status != PrescriptionStatusConstants.Cancelled)
        {
            throw new AppException(ErrorCode.PRESCRIPTION_EXISTED);
        }

        var details = await BuildDetailsAsync(request.Details);

        if (record.Prescription != null)
        {
            var cancelledPrescription =
                await _prescriptionRepository.GetByIdAsync(
                    record.Prescription.PrescriptionId
                );

            if (cancelledPrescription == null)
            {
                throw new AppException(
                    ErrorCode.PRESCRIPTION_NOT_FOUND
                );
            }

            cancelledPrescription.PrescriptionDate = ClinicNow;
            cancelledPrescription.Status =
                PrescriptionStatusConstants.Issued;
            cancelledPrescription.DispensedAt = null;
            cancelledPrescription.Notes =
                NormalizeOptionalText(request.Notes);
            cancelledPrescription.UpdatedAt = DateTime.UtcNow;
            cancelledPrescription.Details.Clear();

            foreach (var detail in details)
            {
                cancelledPrescription.Details.Add(detail);
            }

            await _prescriptionRepository.SaveChangesAsync();

            return await GetByIdAsync(
                cancelledPrescription.PrescriptionId
            );
        }

        var prescription = new Prescription
        {
            MedicalRecordId = record.MedicalRecordId,
            PrescriptionDate = ClinicNow,
            Status = PrescriptionStatusConstants.Issued,
            Notes = NormalizeOptionalText(request.Notes),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Details = details
        };

        await _prescriptionRepository.AddAsync(prescription);
        await _prescriptionRepository.SaveChangesAsync();

        return await GetByIdAsync(prescription.PrescriptionId);
    }

    public async Task<PrescriptionResponse> UpdateAsync(
        int prescriptionId,
        UpdatePrescriptionRequest request)
    {
        ValidatePrescription(
            prescriptionId,
            request.Details
        );

        var prescription =
            await _prescriptionRepository.GetByIdAsync(
                prescriptionId
            );

        if (prescription == null)
        {
            throw new AppException(ErrorCode.PRESCRIPTION_NOT_FOUND);
        }

        await RequireRecordScopeAsync(
            prescription.MedicalRecord.DoctorId
        );

        if (prescription.Status != PrescriptionStatusConstants.Issued)
        {
            throw new AppException(
                ErrorCode.PRESCRIPTION_INVALID_STATUS
            );
        }

        EnsureRecordCanBePrescribed(prescription.MedicalRecord);

        var details = await BuildDetailsAsync(request.Details);

        prescription.Notes = NormalizeOptionalText(request.Notes);
        prescription.UpdatedAt = DateTime.UtcNow;
        prescription.Details.Clear();

        foreach (var detail in details)
        {
            prescription.Details.Add(detail);
        }

        await _prescriptionRepository.SaveChangesAsync();

        return await GetByIdAsync(prescriptionId);
    }

    public async Task<PrescriptionResponse> CancelAsync(
        int prescriptionId)
    {
        var prescription =
            await _prescriptionRepository.GetByIdAsync(
                prescriptionId
            );

        if (prescription == null)
        {
            throw new AppException(ErrorCode.PRESCRIPTION_NOT_FOUND);
        }

        await RequireRecordScopeAsync(
            prescription.MedicalRecord.DoctorId
        );

        if (prescription.Status != PrescriptionStatusConstants.Issued)
        {
            throw new AppException(
                ErrorCode.PRESCRIPTION_INVALID_STATUS
            );
        }

        prescription.Status = PrescriptionStatusConstants.Cancelled;
        prescription.UpdatedAt = DateTime.UtcNow;

        await _prescriptionRepository.SaveChangesAsync();

        return prescription.ToResponse(GetClinicToday());
    }

    private static void ValidatePrescription(
        int id,
        IReadOnlyCollection<SavePrescriptionDetailRequest> details)
    {
        if (id <= 0 || details.Count == 0)
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (details.Any(x =>
            x.MedicineId <= 0 ||
            x.Quantity <= 0 ||
            string.IsNullOrWhiteSpace(x.Dosage) ||
            string.IsNullOrWhiteSpace(x.Instructions)))
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (details.Any(x =>
            x.Dosage.Length > 100 ||
            x.Instructions.Length > 255))
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        var hasDuplicateMedicine = details
            .GroupBy(x => x.MedicineId)
            .Any(x => x.Count() > 1);

        if (hasDuplicateMedicine)
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    private static void EnsureRecordCanBePrescribed(
        MedicalRecord record)
    {
        if (record.Appointment.Status is
            AppointmentStatusConstants.Pending or
            AppointmentStatusConstants.Confirmed or
            AppointmentStatusConstants.Cancelled)
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_INVALID_STATUS
            );
        }
    }

    private async Task<List<PrescriptionDetail>> BuildDetailsAsync(
        IReadOnlyCollection<SavePrescriptionDetailRequest> requests)
    {
        var medicineIds = requests
            .Select(x => x.MedicineId)
            .Distinct()
            .ToList();

        var medicines =
            await _prescriptionRepository.GetMedicinesByIdsAsync(
                medicineIds
            );

        if (medicines.Count != medicineIds.Count)
        {
            throw new AppException(ErrorCode.MEDICINE_NOT_FOUND);
        }

        return requests
            .Select(request => new PrescriptionDetail
            {
                MedicineId = request.MedicineId,
                Dosage = request.Dosage.Trim(),
                Quantity = request.Quantity,
                Instructions = request.Instructions.Trim()
            })
            .ToList();
    }

    private async Task<int?> AllowedDoctorIdAsync()
    {
        if (_currentUser.Role == RoleConstants.Admin)
        {
            return null;
        }

        var doctorId = await _db.Doctors.AsNoTracking()
            .Where(x =>
                x.UserId == _currentUser.GetRequiredUserId() &&
                x.IsActive)
            .Select(x => (int?)x.DoctorId)
            .SingleOrDefaultAsync();

        if (!doctorId.HasValue)
        {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return doctorId;
    }

    private async Task RequireRecordScopeAsync(int doctorId)
    {
        var allowedDoctorId = await AllowedDoctorIdAsync();

        if (allowedDoctorId.HasValue &&
            allowedDoctorId.Value != doctorId)
        {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    private static DateOnly GetClinicToday()
    {
        return DateOnly.FromDateTime(ClinicNow);
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}

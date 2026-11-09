using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Helpers;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class PatientService : IPatientService
{
    private readonly IPatientRepository _patientRepository;
    private readonly ICurrentUserService _currentUser;

    public PatientService(
        IPatientRepository patientRepository,
        ICurrentUserService currentUser)
    {
        _patientRepository = patientRepository;
        _currentUser = currentUser;
    }

    public async Task<PatientProfileResponse> GetMyProfileAsync()
    {
        var patient = await _patientRepository.GetByUserIdAsync(_currentUser.GetRequiredUserId())
            ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND);

        return MapProfile(patient);
    }

    public async Task<PatientProfileResponse> UpdatePatientProfileAsync(
        UpdatePatientProfileRequest request)
    {
        var patient = await _patientRepository.GetByUserIdAsync(
                _currentUser.GetRequiredUserId(),
                trackChanges: true)
            ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND);

        if (request.BirthDate.HasValue
            && DateOnly.FromDateTime(request.BirthDate.Value) > ClinicClock.Today)
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        var identityNumber = string.IsNullOrWhiteSpace(request.IdentityNumber)
            ? null
            : request.IdentityNumber.Trim();

        if (identityNumber is not null
            && await _patientRepository.IdentityNumberInUseAsync(identityNumber, patient.PatientId))
        {
            throw new AppException(ErrorCode.PATIENT_IDENTITY_CONFLICT);
        }

        patient.FullName = request.FullName.Trim();
        patient.Phone = request.Phone.Trim();
        patient.BirthDate = request.BirthDate?.Date;
        patient.IdentityNumber = identityNumber;
        patient.InsuranceCode = string.IsNullOrWhiteSpace(request.InsuranceCode)
            ? null
            : request.InsuranceCode.Trim();

        try
        {
            await _patientRepository.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            // Another request claimed the same identity number between the check and the save.
            throw new AppException(ErrorCode.PATIENT_IDENTITY_CONFLICT);
        }

        return MapProfile(patient);
    }

    public async Task<PatientProfileResponse> CreateMyProfileAsync(UpdatePatientProfileRequest request)
    {
        var userId = _currentUser.GetRequiredUserId();
        if (await _patientRepository.HasProfileForUserAsync(userId))
            throw new AppException(ErrorCode.PATIENT_PROFILE_EXISTS);

        if (request.BirthDate.HasValue
            && DateOnly.FromDateTime(request.BirthDate.Value) > ClinicClock.Today)
        {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        var fullName = request.FullName.Trim();
        var phone = request.Phone.Trim();
        var identityNumber = string.IsNullOrWhiteSpace(request.IdentityNumber)
            ? null
            : request.IdentityNumber.Trim();

        // An existing unlinked Patient record is never auto-linked here: the caller has not been
        // verified as that person (unlike the staff-mediated walk-in match flow), so matching only
        // blocks self-service creation and sends them to reception to link their record in person.
        if (await _patientRepository.FindUnlinkedMatchAsync(fullName, phone, identityNumber) != null)
            throw new AppException(ErrorCode.PATIENT_MATCH_REQUIRED);

        var patient = new Patient
        {
            FullName = fullName,
            Phone = phone,
            BirthDate = request.BirthDate?.Date,
            IdentityNumber = identityNumber,
            InsuranceCode = string.IsNullOrWhiteSpace(request.InsuranceCode) ? null : request.InsuranceCode.Trim(),
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };
        await _patientRepository.AddAsync(patient);
        try
        {
            await _patientRepository.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new AppException(ErrorCode.PATIENT_IDENTITY_CONFLICT);
        }
        return MapProfile(patient);
    }

    private static PatientProfileResponse MapProfile(Patient patient) => new()
    {
        PatientId = patient.PatientId,
        FullName = patient.FullName,
        Phone = patient.Phone,
        BirthDate = patient.BirthDate,
        IdentityNumber = patient.IdentityNumber,
        InsuranceCode = patient.InsuranceCode,
        CreatedAt = patient.CreatedAt
    };
}

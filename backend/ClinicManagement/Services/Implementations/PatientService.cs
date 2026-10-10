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

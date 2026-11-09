using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Helpers;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class DoctorService : IDoctorService
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly ICurrentUserService _currentUser;

    public DoctorService(
        IDoctorRepository doctorRepository,
        ICurrentUserService currentUser)
    {
        _doctorRepository = doctorRepository;
        _currentUser = currentUser;
    }

    public async Task<PagedResponse<PublicDoctorResponse>> SearchPublicDoctorsAsync(
        PublicDoctorQuery query)
    {
        var today = ClinicClock.Today;
        var (doctors, total) = await _doctorRepository.GetPublicPageAsync(query, today);

        var doctorIds = doctors.Select(x => x.DoctorId).ToList();
        var roomsByDoctor = (await _doctorRepository.GetUpcomingRoomsAsync(doctorIds, today))
            .GroupBy(x => x.DoctorId)
            .ToDictionary(
                x => x.Key,
                x => x.Select(room => new DoctorRoomResponse
                {
                    RoomId = room.RoomId,
                    RoomCode = room.RoomCode,
                    RoomName = room.RoomName
                }).ToList());

        var items = doctors
            .Select(doctor => MapPublicDoctor(
                doctor,
                roomsByDoctor.GetValueOrDefault(doctor.DoctorId) ?? []))
            .ToList();

        return new PagedResponse<PublicDoctorResponse>(
            items,
            query.PageNumber,
            query.PageSize,
            total);
    }

    public async Task<DoctorProfileResponse> GetMyProfileAsync()
    {
        var doctor = await _doctorRepository.GetByUserIdAsync(_currentUser.GetRequiredUserId())
            ?? throw new AppException(ErrorCode.DOCTOR_NOT_FOUND);

        return MapProfile(doctor);
    }

    public async Task<DoctorProfileResponse> UpdateMyProfileAsync(
        UpdateDoctorProfileRequest request)
    {
        var doctor = await _doctorRepository.GetByUserIdAsync(
                _currentUser.GetRequiredUserId(),
                trackChanges: true)
            ?? throw new AppException(ErrorCode.DOCTOR_NOT_FOUND);

        // Department and specialization are assigned by admin, so a doctor edits only personal details here.
        doctor.FullName = request.FullName.Trim();
        doctor.Title = request.Title.Trim();
        doctor.ExperienceYears = request.ExperienceYears
            ?? throw new AppException(ErrorCode.INVALID_REQUEST);
        doctor.Biography = string.IsNullOrWhiteSpace(request.Biography)
            ? null
            : request.Biography.Trim();

        await _doctorRepository.SaveChangesAsync();
        return MapProfile(doctor);
    }

    public async Task<PagedResponse<AdminDoctorResponse>> GetAdminDoctorsAsync(AdminDoctorQuery query)
    {
        var (items, total) = await _doctorRepository.GetAdminPageAsync(query);
        return new PagedResponse<AdminDoctorResponse>(items.Select(MapAdmin), query.PageNumber, query.PageSize, total);
    }

    public async Task<AdminDoctorResponse> GetAdminDoctorByIdAsync(int doctorId) =>
        MapAdmin(await _doctorRepository.GetByIdForAdminAsync(doctorId) ?? throw new AppException(ErrorCode.DOCTOR_NOT_FOUND));

    public async Task<AdminDoctorResponse> CreateDoctorAsync(CreateDoctorRequest request)
    {
        if (!await _doctorRepository.SpecializationBelongsToDepartmentAsync(request.SpecializationId, request.DepartmentId))
            throw new AppException(ErrorCode.INVALID_DEPARTMENT);

        var doctor = new Doctor
        {
            FullName = request.FullName.Trim(),
            Title = request.Title.Trim(),
            ExperienceYears = request.ExperienceYears ?? throw new AppException(ErrorCode.INVALID_REQUEST),
            Biography = string.IsNullOrWhiteSpace(request.Biography) ? null : request.Biography.Trim(),
            DepartmentId = request.DepartmentId,
            SpecializationId = request.SpecializationId,
            IsActive = true
        };
        await _doctorRepository.AddAsync(doctor);
        await _doctorRepository.SaveChangesAsync();
        return MapAdmin(await _doctorRepository.GetByIdForAdminAsync(doctor.DoctorId) ?? doctor);
    }

    public async Task<AdminDoctorResponse> UpdateDoctorAsync(int doctorId, UpdateDoctorRequest request)
    {
        var doctor = await _doctorRepository.GetByIdForAdminAsync(doctorId) ?? throw new AppException(ErrorCode.DOCTOR_NOT_FOUND);
        if (!await _doctorRepository.SpecializationBelongsToDepartmentAsync(request.SpecializationId, request.DepartmentId))
            throw new AppException(ErrorCode.INVALID_DEPARTMENT);

        doctor.FullName = request.FullName.Trim();
        doctor.Title = request.Title.Trim();
        doctor.ExperienceYears = request.ExperienceYears ?? throw new AppException(ErrorCode.INVALID_REQUEST);
        doctor.Biography = string.IsNullOrWhiteSpace(request.Biography) ? null : request.Biography.Trim();
        doctor.DepartmentId = request.DepartmentId;
        doctor.SpecializationId = request.SpecializationId;
        doctor.IsActive = request.IsActive;

        await _doctorRepository.SaveChangesAsync();
        return MapAdmin(await _doctorRepository.GetByIdForAdminAsync(doctorId) ?? doctor);
    }

    public async Task UpdateDoctorStatusAsync(int doctorId, bool isActive)
    {
        var doctor = await _doctorRepository.GetByIdForAdminAsync(doctorId) ?? throw new AppException(ErrorCode.DOCTOR_NOT_FOUND);
        doctor.IsActive = isActive;
        await _doctorRepository.SaveChangesAsync();
    }

    private static AdminDoctorResponse MapAdmin(Doctor doctor) => new()
    {
        DoctorId = doctor.DoctorId,
        FullName = doctor.FullName,
        Title = doctor.Title,
        ExperienceYears = doctor.ExperienceYears,
        Biography = doctor.Biography,
        DepartmentId = doctor.DepartmentId,
        DepartmentName = doctor.Department.Name,
        SpecializationId = doctor.SpecializationId,
        SpecializationName = doctor.Specialization.Name,
        UserId = doctor.UserId,
        IsActive = doctor.IsActive
    };

    private static PublicDoctorResponse MapPublicDoctor(
        Doctor doctor,
        List<DoctorRoomResponse> rooms) => new()
    {
        DoctorId = doctor.DoctorId,
        FullName = doctor.FullName,
        Title = doctor.Title,
        ExperienceYears = doctor.ExperienceYears,
        DepartmentId = doctor.DepartmentId,
        DepartmentName = doctor.Department.Name,
        Biography = doctor.Biography,
        Rooms = rooms
    };

    private static DoctorProfileResponse MapProfile(Doctor doctor) => new()
    {
        DoctorId = doctor.DoctorId,
        FullName = doctor.FullName,
        Title = doctor.Title,
        ExperienceYears = doctor.ExperienceYears,
        Biography = doctor.Biography,
        DepartmentId = doctor.DepartmentId,
        DepartmentName = doctor.Department.Name,
        SpecializationName = doctor.Specialization.Name
    };
}

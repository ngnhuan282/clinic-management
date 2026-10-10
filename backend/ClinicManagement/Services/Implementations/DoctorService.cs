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

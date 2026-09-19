using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class BookingService : IBookingService
{
    private static readonly TimeSpan SlotDuration =
        TimeSpan.FromMinutes(30);

    private static readonly TimeSpan MorningStart =
        new(8, 0, 0);

    private static readonly TimeSpan MorningEnd =
        new(11, 30, 0);

    private static readonly TimeSpan AfternoonStart =
        new(13, 30, 0);

    private static readonly TimeSpan AfternoonEnd =
        new(16, 30, 0);

    private readonly IDepartmentRepository _departmentRepository;
    private readonly IDoctorRepository _doctorRepository;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly ILogger<BookingService> _logger;

    public BookingService(
        IDepartmentRepository departmentRepository,
        IDoctorRepository doctorRepository,
        IAppointmentRepository appointmentRepository,
        ILogger<BookingService> logger)
    {
        _departmentRepository = departmentRepository;
        _doctorRepository = doctorRepository;
        _appointmentRepository = appointmentRepository;
        _logger = logger;
    }

    public async Task<List<DepartmentResponse>> GetDepartmentsAsync()
    {
        var departments =
            await _departmentRepository.GetActiveAsync();

        return departments
            .Select(x => new DepartmentResponse
            {
                DepartmentId = x.DepartmentId,
                Code = x.Code,
                Name = x.Name,
                Description = x.Description,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToList();
    }

    public async Task<List<DoctorResponse>> GetDoctorsByDepartmentAsync(
        int departmentId)
    {
        var doctors =
            await _doctorRepository.GetActiveByDepartmentAsync(
                departmentId
            );

        return doctors
            .Select(MapDoctor)
            .ToList();
    }

    public async Task<List<AvailableSlotResponse>> GetAvailableSlotsAsync(
        int doctorId,
        DateTime appointmentDate)
    {
        if (appointmentDate.Date < DateTime.Today)
        {
            throw new AppException(
                ErrorCode.INVALID_REQUEST
            );
        }

        var doctor =
            await _doctorRepository.GetActiveByIdAsync(
                doctorId
            );

        if (doctor == null)
        {
            throw new AppException(
                ErrorCode.DOCTOR_NOT_FOUND
            );
        }

        var bookedSlots =
            await _appointmentRepository.GetBookedSlotsAsync(
                doctorId,
                appointmentDate
            );

        var bookedStartTimes =
            bookedSlots
                .Select(x => x.StartTime)
                .ToHashSet();

        return BuildDailySlots()
            .Select(x => new AvailableSlotResponse
            {
                StartTime = x.StartTime,
                EndTime = x.EndTime,
                IsAvailable =
                    !bookedStartTimes.Contains(x.StartTime)
            })
            .ToList();
    }

    public async Task<AppointmentResponse> CreateAppointmentAsync(
        CreateAppointmentRequest request)
    {
        ValidateCreateRequest(request);

        var date = request.AppointmentDate.Date;
        var startTime = request.StartTime;
        var endTime = startTime.Add(SlotDuration);

        var doctor =
            await _doctorRepository.GetActiveByIdAsync(
                request.DoctorId
            );

        if (doctor == null)
        {
            throw new AppException(
                ErrorCode.DOCTOR_NOT_FOUND
            );
        }

        if (!IsValidSlot(startTime))
        {
            throw new AppException(
                ErrorCode.INVALID_REQUEST
            );
        }

        var hasConflict =
            await _appointmentRepository.HasConflictAsync(
                request.DoctorId,
                date,
                startTime
            );

        if (hasConflict)
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_CONFLICT
            );
        }

        var appointment = new Appointment
        {
            DoctorId = request.DoctorId,
            PatientName = request.PatientName.Trim(),
            PatientPhone = request.PatientPhone.Trim(),
            AppointmentDate = date,
            StartTime = startTime,
            EndTime = endTime,
            Reason = request.Reason.Trim(),
            Status = AppointmentStatusConstants.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _appointmentRepository.AddAsync(
            appointment
        );

        try
        {
            await _appointmentRepository.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            _logger.LogWarning(
                exception,
                "Appointment slot conflict."
            );

            throw new AppException(
                ErrorCode.APPOINTMENT_CONFLICT
            );
        }

        appointment.Doctor = doctor;

        return MapAppointment(appointment);
    }

    private static void ValidateCreateRequest(
        CreateAppointmentRequest request)
    {
        if (request.DoctorId <= 0
            || request.AppointmentDate.Date < DateTime.Today
            || string.IsNullOrWhiteSpace(request.PatientName)
            || string.IsNullOrWhiteSpace(request.PatientPhone)
            || string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new AppException(
                ErrorCode.INVALID_REQUEST
            );
        }
    }

    private static bool IsValidSlot(
        TimeSpan startTime)
    {
        return BuildDailySlots()
            .Any(x => x.StartTime == startTime);
    }

    private static List<AvailableSlotResponse> BuildDailySlots()
    {
        var slots = new List<AvailableSlotResponse>();

        AddSlots(slots, MorningStart, MorningEnd);
        AddSlots(slots, AfternoonStart, AfternoonEnd);

        return slots;
    }

    private static void AddSlots(
        List<AvailableSlotResponse> slots,
        TimeSpan start,
        TimeSpan end)
    {
        for (var current = start;
             current < end;
             current = current.Add(SlotDuration))
        {
            slots.Add(new AvailableSlotResponse
            {
                StartTime = current,
                EndTime = current.Add(SlotDuration),
                IsAvailable = true
            });
        }
    }

    private static DoctorResponse MapDoctor(
        Doctor doctor)
    {
        return new DoctorResponse
        {
            DoctorId = doctor.DoctorId,
            FullName = doctor.FullName,
            Title = doctor.Title,
            ExperienceYears = doctor.ExperienceYears,
            DepartmentId = doctor.DepartmentId,
            DepartmentName = doctor.Department.Name,
            Biography = doctor.Biography
        };
    }

    private static AppointmentResponse MapAppointment(
        Appointment appointment)
    {
        return new AppointmentResponse
        {
            AppointmentId = appointment.AppointmentId,
            DoctorId = appointment.DoctorId,
            DoctorName = appointment.Doctor.FullName,
            DepartmentName =
                appointment.Doctor.Department.Name,
            PatientName = appointment.PatientName,
            PatientPhone = appointment.PatientPhone,
            AppointmentDate = appointment.AppointmentDate,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Reason = appointment.Reason,
            Status = appointment.Status
        };
    }
}

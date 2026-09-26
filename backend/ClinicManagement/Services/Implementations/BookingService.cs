using ClinicManagement.Commons;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;

namespace ClinicManagement.Services.Implementations;

public class BookingService : IBookingService
{
    private static readonly TimeSpan SlotDuration =
        TimeSpan.FromMinutes(30);

    private static DateTime ClinicNow => TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Asia/Ho_Chi_Minh");

    private readonly IDepartmentRepository _departmentRepository;
    private readonly IDoctorRepository _doctorRepository;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly ILogger<BookingService> _logger;
    private readonly ICurrentUserService _currentUser;

    public BookingService(
        IDepartmentRepository departmentRepository,
        IDoctorRepository doctorRepository,
        IAppointmentRepository appointmentRepository,
        ILogger<BookingService> logger,
        ICurrentUserService currentUser)
    {
        _departmentRepository = departmentRepository;
        _doctorRepository = doctorRepository;
        _appointmentRepository = appointmentRepository;
        _logger = logger;
        _currentUser = currentUser;
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
        if (appointmentDate.Date < ClinicNow.Date)
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

        var schedules = await _doctorRepository.GetSchedulesAsync(doctorId, appointmentDate.DayOfWeek);
        return BuildDailySlots(schedules)
            .Select(x => new AvailableSlotResponse
            {
                StartTime = x.StartTime,
                EndTime = x.EndTime,
                IsAvailable =
                    !bookedStartTimes.Contains(x.StartTime)
                    && appointmentDate.Date.Add(x.StartTime) > ClinicNow
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

        var schedules = await _doctorRepository.GetSchedulesAsync(request.DoctorId, date.DayOfWeek);
        if (!BuildDailySlots(schedules).Any(x => x.StartTime == startTime))
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
            PatientId = _currentUser.GetRequiredUserId(),
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
        catch (DbUpdateException exception) when (exception.InnerException is SqlException { Number: 2601 or 2627 })
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

    public async Task<AppointmentResponse> StartExaminationAsync(
        int appointmentId)
    {
        var appointment =
            await _appointmentRepository.GetByIdAsync(
                appointmentId
            );

        if (appointment == null)
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_NOT_FOUND
            );
        }

        if (appointment.Status == AppointmentStatusConstants.Cancelled ||
            appointment.Status == AppointmentStatusConstants.Completed)
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_INVALID_STATUS
            );
        }

        if (appointment.Status == AppointmentStatusConstants.Pending ||
            appointment.Status == AppointmentStatusConstants.Confirmed)
        {
            if (appointment.AppointmentDate.Date != ClinicNow.Date)
            {
                throw new AppException(
                    ErrorCode.APPOINTMENT_INVALID_STATUS
                );
            }

            appointment.Status = AppointmentStatusConstants.InProgress;
            await _appointmentRepository.SaveChangesAsync();
        }

        if (appointment.Status != AppointmentStatusConstants.InProgress)
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_INVALID_STATUS
            );
        }

        return MapAppointment(appointment);
    }

    private static void ValidateCreateRequest(
        CreateAppointmentRequest request)
    {
        if (request.DoctorId <= 0
            || request.AppointmentDate.Date.Add(request.StartTime) <= ClinicNow
            || string.IsNullOrWhiteSpace(request.PatientName)
            || string.IsNullOrWhiteSpace(request.PatientPhone)
            || string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new AppException(
                ErrorCode.INVALID_REQUEST
            );
        }
    }

    private static List<AvailableSlotResponse> BuildDailySlots(IEnumerable<DoctorSchedule> schedules)
    {
        var slots = new List<AvailableSlotResponse>();

        foreach (var schedule in schedules)
            AddSlots(slots, schedule.StartTime, schedule.EndTime);

        return slots.DistinctBy(x => x.StartTime).OrderBy(x => x.StartTime).ToList();
    }

    private static void AddSlots(
        List<AvailableSlotResponse> slots,
        TimeSpan start,
        TimeSpan end)
    {
        for (var current = start;
             current.Add(SlotDuration) <= end;
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

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
    private readonly IReceptionRepository _receptionRepository;
    private readonly ILogger<BookingService> _logger;
    private readonly ICurrentUserService _currentUser;

    public BookingService(
        IDepartmentRepository departmentRepository,
        IDoctorRepository doctorRepository,
        IAppointmentRepository appointmentRepository,
        IReceptionRepository receptionRepository,
        ILogger<BookingService> logger,
        ICurrentUserService currentUser)
    {
        _departmentRepository = departmentRepository;
        _doctorRepository = doctorRepository;
        _appointmentRepository = appointmentRepository;
        _receptionRepository = receptionRepository;
        _logger = logger;
        _currentUser = currentUser;
    }

    public async Task<PagedResponse<AppointmentResponse>> GetAppointmentsAsync(
        AppointmentQuery query)
    {
        ValidateStatusFilter(query.Status);

        if (query.DateFrom.HasValue
            && query.DateTo.HasValue
            && query.DateFrom.Value.Date > query.DateTo.Value.Date)
        {
            throw new AppException(
                ErrorCode.INVALID_REQUEST
            );
        }

        var (items, total) =
            await _appointmentRepository.GetPageAsync(
                query
            );

        return new PagedResponse<AppointmentResponse>(
            items.Select(MapAppointment),
            query.PageNumber,
            query.PageSize,
            total
        );
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

        var schedules = await _doctorRepository.GetSchedulesAsync(doctorId, DateOnly.FromDateTime(appointmentDate.Date));
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
        return await CreateAppointmentInternalAsync(
            request,
            _currentUser.GetRequiredUserId(),
            AppointmentStatusConstants.Pending
        );
    }

    public async Task<AppointmentResponse> CreateDirectAppointmentAsync(
        CreateDirectAppointmentRequest request)
    {
        return await CreateAppointmentInternalAsync(
            request,
            null,
            AppointmentStatusConstants.Confirmed
        );
    }

    private async Task<AppointmentResponse> CreateAppointmentInternalAsync(
        CreateAppointmentRequest request,
        int? patientId,
        string status)
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

        var schedules = await _doctorRepository.GetSchedulesAsync(request.DoctorId, DateOnly.FromDateTime(date));
        if (!BuildDailySlots(schedules).Any(x => x.StartTime == startTime))
        {
            throw new AppException(
                ErrorCode.INVALID_REQUEST
            );
        }
        var timeSlotId = schedules.SelectMany(x => x.TimeSlots)
            .Where(x => x.StartTime == startTime && x.IsAvailable)
            .Select(x => (Guid?)x.SlotId).FirstOrDefault();

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
            PatientId = patientId,
            TimeSlotId = timeSlotId,
            PatientName = request.PatientName.Trim(),
            PatientPhone = request.PatientPhone.Trim(),
            AppointmentDate = date,
            StartTime = startTime,
            EndTime = endTime,
            Reason = request.Reason.Trim(),
            Status = status,
            CreatedAt = DateTime.UtcNow
        };

        await using var transaction = request is CreateDirectAppointmentRequest
            ? await _receptionRepository.BeginTransactionAsync()
            : null;
        if (request is CreateDirectAppointmentRequest directRequest)
            appointment.PatientProfileId = await ResolveDirectPatientAsync(directRequest);

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
        if (transaction != null) await transaction.CommitAsync();
        _logger.LogInformation("Appointment {AppointmentId} created with status {Status}",
            appointment.AppointmentId, appointment.Status);

        return MapAppointment(appointment);
    }

    private async Task<int> ResolveDirectPatientAsync(CreateDirectAppointmentRequest request)
    {
        if (request.PatientProfileId.HasValue)
        {
            var existing = await _receptionRepository.GetPatientAsync(request.PatientProfileId.Value)
                ?? throw new AppException(ErrorCode.PATIENT_NOT_FOUND);
            if (!string.Equals(existing.FullName.Trim(), request.PatientName.Trim(), StringComparison.OrdinalIgnoreCase)
                || existing.Phone.Trim() != request.PatientPhone.Trim()
                || (request.BirthDate.HasValue && existing.BirthDate?.Date != request.BirthDate.Value.Date)
                || (!string.IsNullOrWhiteSpace(request.IdentityNumber)
                    && existing.IdentityNumber != request.IdentityNumber.Trim()))
                throw new AppException(ErrorCode.PATIENT_IDENTITY_MISMATCH);
            return existing.PatientId;
        }

        var name = request.PatientName.Trim();
        var phone = request.PatientPhone.Trim();
        var identity = string.IsNullOrWhiteSpace(request.IdentityNumber)
            ? null : request.IdentityNumber.Trim();
        if (await _receptionRepository.HasMatchingPatientAsync(name, phone, identity))
            throw new AppException(ErrorCode.PATIENT_MATCH_REQUIRED);

        var patient = new Patient
        {
            FullName = name,
            Phone = phone,
            BirthDate = request.BirthDate?.Date,
            IdentityNumber = identity,
            InsuranceCode = string.IsNullOrWhiteSpace(request.InsuranceCode)
                ? null : request.InsuranceCode.Trim(),
            CreatedAt = DateTime.UtcNow
        };
        await _receptionRepository.AddPatientAsync(patient);
        try { await _receptionRepository.SaveChangesAsync(); }
        catch (DbUpdateException exception) when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new AppException(ErrorCode.PATIENT_MATCH_REQUIRED);
        }
        return patient.PatientId;
    }

    public async Task<AppointmentResponse> ConfirmAppointmentAsync(
        int appointmentId)
    {
        var appointment =
            await GetAppointmentForReceptionAsync(
                appointmentId
            );

        if (appointment.Status != AppointmentStatusConstants.Pending)
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_INVALID_STATUS
            );
        }

        appointment.Status =
            AppointmentStatusConstants.Confirmed;

        await _appointmentRepository.SaveChangesAsync();
        _logger.LogInformation("Appointment {AppointmentId} confirmed", appointmentId);

        return MapAppointment(appointment);
    }

    public async Task<AppointmentResponse> RescheduleAppointmentAsync(
        int appointmentId,
        RescheduleAppointmentRequest request)
    {
        ValidateRescheduleRequest(request);

        var appointment =
            await GetAppointmentForReceptionAsync(
                appointmentId
            );

        if (appointment.Status is AppointmentStatusConstants.Cancelled
            or AppointmentStatusConstants.Completed
            or AppointmentStatusConstants.InProgress || appointment.CheckedInAt.HasValue)
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_INVALID_STATUS
            );
        }

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

        var date = request.AppointmentDate.Date;
        var startTime = request.StartTime;
        var schedules =
            await _doctorRepository.GetSchedulesAsync(
                request.DoctorId,
                DateOnly.FromDateTime(date)
            );

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
                startTime,
                appointmentId
            );

        if (hasConflict)
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_CONFLICT
            );
        }

        appointment.DoctorId = request.DoctorId;
        appointment.AppointmentDate = date;
        appointment.StartTime = startTime;
        appointment.EndTime = startTime.Add(SlotDuration);
        appointment.Status = AppointmentStatusConstants.Confirmed;

        try
        {
            await _appointmentRepository.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            _logger.LogWarning(
                exception,
                "Appointment reschedule slot conflict."
            );

            throw new AppException(
                ErrorCode.APPOINTMENT_CONFLICT
            );
        }

        appointment.Doctor = doctor;
        _logger.LogInformation("Appointment {AppointmentId} rescheduled", appointmentId);

        return MapAppointment(appointment);
    }

    public async Task<AppointmentResponse> CancelAppointmentAsync(
        int appointmentId)
    {
        var appointment =
            await GetAppointmentForReceptionAsync(
                appointmentId
            );

        if (appointment.Status is AppointmentStatusConstants.Cancelled
            or AppointmentStatusConstants.Completed
            or AppointmentStatusConstants.InProgress || appointment.CheckedInAt.HasValue)
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_INVALID_STATUS
            );
        }

        appointment.Status =
            AppointmentStatusConstants.Cancelled;

        await _appointmentRepository.SaveChangesAsync();
        _logger.LogInformation("Appointment {AppointmentId} cancelled", appointmentId);

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

        if (_currentUser.Role != RoleConstants.Admin &&
            appointment.Doctor.UserId != _currentUser.GetRequiredUserId())
            throw new AppException(ErrorCode.UNAUTHORIZED);

        if (appointment.Status == AppointmentStatusConstants.Cancelled
            || appointment.Status == AppointmentStatusConstants.Completed)
        {
            throw new AppException(
                ErrorCode.APPOINTMENT_INVALID_STATUS
            );
        }

        if (!appointment.CheckedInAt.HasValue || !appointment.BookVerifiedAt.HasValue
            || !appointment.PatientBookId.HasValue)
            throw new AppException(ErrorCode.BOOK_NOT_VERIFIED);

        if (appointment.Status == AppointmentStatusConstants.Pending
            || appointment.Status == AppointmentStatusConstants.Confirmed)
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
            || string.IsNullOrWhiteSpace(request.Reason)
            || (request is CreateDirectAppointmentRequest direct && direct.BirthDate?.Date > ClinicNow.Date))
        {
            throw new AppException(
                ErrorCode.INVALID_REQUEST
            );
        }
    }

    private async Task<Appointment> GetAppointmentForReceptionAsync(
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

        return appointment;
    }

    private static void ValidateRescheduleRequest(
        RescheduleAppointmentRequest request)
    {
        if (request.DoctorId <= 0
            || request.AppointmentDate.Date.Add(request.StartTime) <= ClinicNow)
        {
            throw new AppException(
                ErrorCode.INVALID_REQUEST
            );
        }
    }

    private static void ValidateStatusFilter(
        string? status)
    {
        if (string.IsNullOrWhiteSpace(status)
            || IsKnownStatus(status.Trim()))
        {
            return;
        }

        throw new AppException(
            ErrorCode.APPOINTMENT_INVALID_STATUS
        );
    }

    private static bool IsKnownStatus(
        string status)
    {
        return status is AppointmentStatusConstants.Pending
            or AppointmentStatusConstants.Confirmed
            or AppointmentStatusConstants.InProgress
            or AppointmentStatusConstants.Completed
            or AppointmentStatusConstants.Cancelled;
    }

    private static List<AvailableSlotResponse> BuildDailySlots(IEnumerable<DoctorSchedule> schedules)
    {
        var slots = new List<AvailableSlotResponse>();

        foreach (var schedule in schedules)
        foreach (var slot in schedule.TimeSlots.Where(x => x.IsAvailable))
            slots.Add(new AvailableSlotResponse
            {
                SlotId = slot.SlotId,
                StartTime = slot.StartTime,
                EndTime = slot.EndTime,
                IsAvailable = slot.CurrentBooked < slot.MaxCapacity
            });

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
            Status = appointment.Status,
            PatientProfileId = appointment.PatientProfileId,
            PatientBookId = appointment.PatientBookId,
            BookVerifiedAt = appointment.BookVerifiedAt,
            CheckedInAt = appointment.CheckedInAt
        };
    }
}

using ClinicManagement.Data.Entities;

namespace ClinicManagement.DTOs.Responses;

public record DepartmentScheduleResponse(Guid ScheduleId, int DoctorId, string DoctorName,
    int RoomId, string RoomName, DateOnly WorkDate, TimeSpan StartTime, TimeSpan EndTime,
    Shift Shift, int MaxPatients, int BookedPatients, string? ReviewerName, DateTime? ReviewedAt);
public record DepartmentScheduleOption(int Id, string Name);
public record DepartmentScheduleOptionsResponse(int DepartmentId, string DepartmentName,
    List<DepartmentScheduleOption> Doctors, List<DepartmentScheduleOption> Rooms);

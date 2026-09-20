using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ClinicManagement.Data.Configurations;

public class DoctorConfiguration : IEntityTypeConfiguration<Doctor>
{
    public void Configure(EntityTypeBuilder<Doctor> entity)
    {
        entity.Property(x => x.FullName).HasMaxLength(100).IsRequired();
        entity.Property(x => x.Title).HasMaxLength(50).IsRequired();
        entity.Property(x => x.Biography).HasMaxLength(500);
        entity.Property(x => x.IsActive).HasDefaultValue(true);
        entity.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.Restrict);
        entity.HasData(
            new Doctor { DoctorId = 1, DepartmentId = 1, FullName = "Nguyen Minh An", Title = "BS.CKII", ExperienceYears = 12, Biography = "Chuyen sau sieu am tim va tang huyet ap" },
            new Doctor { DoctorId = 2, DepartmentId = 2, FullName = "Tran Thu Ha", Title = "ThS.BS", ExperienceYears = 9, Biography = "Tu van suc khoe tong quat va benh man tinh" },
            new Doctor { DoctorId = 3, DepartmentId = 3, FullName = "Le Quang Huy", Title = "BS.CKI", ExperienceYears = 7, Biography = "Dieu tri viem da co dia, mun va di ung da" });
    }
}

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> entity)
    {
        entity.Property(x => x.PatientName).HasMaxLength(100).IsRequired();
        entity.Property(x => x.PatientPhone).HasMaxLength(15).IsRequired();
        entity.Property(x => x.Reason).HasMaxLength(500).IsRequired();
        entity.Property(x => x.Status).HasMaxLength(20).IsRequired();
        entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETDATE()");
        entity.HasOne(x => x.Doctor).WithMany(x => x.Appointments).HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
        entity.HasIndex(x => new { x.DoctorId, x.AppointmentDate, x.StartTime })
            .IsUnique().HasFilter("[Status] <> 'Cancelled'");
    }
}

public class DoctorScheduleConfiguration : IEntityTypeConfiguration<DoctorSchedule>
{
    public void Configure(EntityTypeBuilder<DoctorSchedule> entity)
    {
        entity.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Restrict);
        entity.HasIndex(x => new { x.DoctorId, x.DayOfWeek, x.StartTime }).IsUnique();
        entity.ToTable(t => t.HasCheckConstraint("CK_DoctorSchedules_Time", "[StartTime] < [EndTime] AND [DayOfWeek] BETWEEN 0 AND 6"));
        var schedules = new List<DoctorSchedule>();
        // Initial recurring master data; availability always reads these rows from the database.
        for (var doctor = 1; doctor <= 3; doctor++)
        for (var day = 1; day <= 6; day++)
        {
            schedules.Add(new DoctorSchedule { DoctorScheduleId = schedules.Count + 1, DoctorId = doctor, DayOfWeek = (DayOfWeek)day, StartTime = new(8, 0, 0), EndTime = new(11, 30, 0) });
            schedules.Add(new DoctorSchedule { DoctorScheduleId = schedules.Count + 1, DoctorId = doctor, DayOfWeek = (DayOfWeek)day, StartTime = new(13, 30, 0), EndTime = new(16, 30, 0) });
        }
        entity.HasData(schedules);
    }
}

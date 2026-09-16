using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Role> Roles => Set<Role>();

    public DbSet<User> Users => Set<User>();

    public DbSet<Department> Departments => Set<Department>();

    public DbSet<Doctor> Doctors => Set<Doctor>();

    public DbSet<Appointment> Appointments => Set<Appointment>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // =========================
        // Role
        // =========================
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(x => x.RoleId);

            entity.Property(x => x.RoleName)
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(x => x.RoleName)
                .IsUnique();

            entity.Property(x => x.Description)
                .HasMaxLength(200);

            entity.HasData(
                new Role
                {
                    RoleId = 1,
                    RoleName = "Admin",
                    Description = "System administrator"
                },
                new Role
                {
                    RoleId = 2,
                    RoleName = "Doctor",
                    Description = "Doctor"
                },
                new Role
                {
                    RoleId = 3,
                    RoleName = "Receptionist",
                    Description = "Receptionist"
                },
                new Role
                {
                    RoleId = 4,
                    RoleName = "Patient",
                    Description = "Patient"
                }
            );
        });

        // =========================
        // User
        // =========================
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.UserId);

            entity.Property(x => x.Username)
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(x => x.Username)
                .IsUnique();

            entity.Property(x => x.PasswordHash)
                .HasMaxLength(256)
                .IsRequired();

            entity.Property(x => x.FullName)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Email)
                .HasMaxLength(100);

            entity.HasIndex(x => x.Email)
                .IsUnique()
                .HasFilter("[Email] IS NOT NULL");

            entity.Property(x => x.Phone)
                .HasMaxLength(15);

            entity.Property(x => x.Status)
                .HasDefaultValue(true);

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("GETDATE()");

            entity.HasOne(x => x.Role)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // =========================
        // Department
        // =========================
        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(x => x.DepartmentId);

            entity.Property(x => x.DepartmentName)
                .HasMaxLength(100)
                .IsRequired();

            entity.HasIndex(x => x.DepartmentName)
                .IsUnique();

            entity.Property(x => x.Description)
                .HasMaxLength(300);

            entity.Property(x => x.IsActive)
                .HasDefaultValue(true);

            entity.HasData(
                new Department
                {
                    DepartmentId = 1,
                    DepartmentName = "Khoa Tim Mạch",
                    Description = "Khám và tư vấn bệnh lý tim mạch",
                    IsActive = true
                },
                new Department
                {
                    DepartmentId = 2,
                    DepartmentName = "Khoa Nội Tổng Quát",
                    Description = "Khám tổng quát và bệnh lý nội khoa",
                    IsActive = true
                },
                new Department
                {
                    DepartmentId = 3,
                    DepartmentName = "Khoa Da Liễu",
                    Description = "Khám da, dị ứng và chăm sóc da",
                    IsActive = true
                }
            );
        });

        // =========================
        // Doctor
        // =========================
        modelBuilder.Entity<Doctor>(entity =>
        {
            entity.HasKey(x => x.DoctorId);

            entity.Property(x => x.FullName)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Title)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.Biography)
                .HasMaxLength(500);

            entity.Property(x => x.IsActive)
                .HasDefaultValue(true);

            entity.HasOne(x => x.Department)
                .WithMany(x => x.Doctors)
                .HasForeignKey(x => x.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasData(
                new Doctor
                {
                    DoctorId = 1,
                    FullName = "Nguyen Minh An",
                    Title = "BS.CKII",
                    ExperienceYears = 12,
                    DepartmentId = 1,
                    Biography = "Chuyen sau sieu am tim va tang huyet ap",
                    IsActive = true
                },
                new Doctor
                {
                    DoctorId = 2,
                    FullName = "Tran Thu Ha",
                    Title = "ThS.BS",
                    ExperienceYears = 9,
                    DepartmentId = 2,
                    Biography = "Tu van suc khoe tong quat va benh man tinh",
                    IsActive = true
                },
                new Doctor
                {
                    DoctorId = 3,
                    FullName = "Le Quang Huy",
                    Title = "BS.CKI",
                    ExperienceYears = 7,
                    DepartmentId = 3,
                    Biography = "Dieu tri viem da co dia, mun va di ung da",
                    IsActive = true
                }
            );
        });

        // =========================
        // Appointment
        // =========================
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(x => x.AppointmentId);

            entity.Property(x => x.PatientName)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.PatientPhone)
                .HasMaxLength(15)
                .IsRequired();

            entity.Property(x => x.Reason)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(x => x.Status)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("GETDATE()");

            entity.HasOne(x => x.Doctor)
                .WithMany(x => x.Appointments)
                .HasForeignKey(x => x.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Patient)
                .WithMany()
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new
                {
                    x.DoctorId,
                    x.AppointmentDate,
                    x.StartTime
                })
                .IsUnique()
                .HasFilter("[Status] <> 'Cancelled'");
        });
    }
}

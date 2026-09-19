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
    public DbSet<Specialization> Specializations => Set<Specialization>();
    public DbSet<Room> Rooms => Set<Room>();

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

<<<<<<< HEAD
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
=======
        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(x => x.DepartmentId);
            entity.Property(x => x.Code).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.Property(x => x.IsActive).HasDefaultValue(true);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("GETDATE()");
            entity.HasIndex(x => x.Code).IsUnique();
            entity.HasIndex(x => x.Name).IsUnique();
            entity.HasData(
                new Department { DepartmentId = 1, Code = "NOI", Name = "Noi tong quat", IsActive = true, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new Department { DepartmentId = 2, Code = "NHI", Name = "Nhi", IsActive = true, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new Department { DepartmentId = 3, Code = "RHM", Name = "Rang ham mat", IsActive = true, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) });
        });

        modelBuilder.Entity<Specialization>(entity =>
        {
            entity.HasKey(x => x.SpecializationId);
            entity.Property(x => x.Code).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.Property(x => x.IsActive).HasDefaultValue(true);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("GETDATE()");
            entity.HasIndex(x => x.Code).IsUnique();
            entity.HasIndex(x => x.Name).IsUnique();
            entity.HasOne(x => x.Department).WithMany(x => x.Specializations).HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasData(
                new Specialization { SpecializationId = 1, Code = "NỘI-TQ", Name = "Nội tổng quát", DepartmentId = 1, IsActive = true, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new Specialization { SpecializationId = 2, Code = "NHI-KHOA", Name = "Nhi khoa", DepartmentId = 2, IsActive = true, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new Specialization { SpecializationId = 3, Code = "RHM-NQ", Name = "Nha khoa tổng quát", DepartmentId = 3, IsActive = true, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) });
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(x => x.RoomId);
            entity.Property(x => x.RoomNumber).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(150).IsRequired();
            entity.Property(x => x.RoomType).HasMaxLength(80);
            entity.Property(x => x.Location).HasMaxLength(150);
            entity.Property(x => x.IsActive).HasDefaultValue(true);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("GETDATE()");
            entity.HasIndex(x => x.RoomNumber).IsUnique();
            entity.HasOne(x => x.Department).WithMany(x => x.Rooms).HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasData(
                new Room { RoomId = 1, RoomNumber = "P101", Name = "Phòng khám Nội 1", RoomType = "Khám bệnh", DepartmentId = 1, Location = "Tầng 1", IsActive = true, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new Room { RoomId = 2, RoomNumber = "P201", Name = "Phòng khám Nhi 1", RoomType = "Khám bệnh", DepartmentId = 2, Location = "Tầng 2", IsActive = true, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new Room { RoomId = 3, RoomNumber = "P301", Name = "Phòng khám Răng hàm mặt 1", RoomType = "Khám bệnh", DepartmentId = 3, Location = "Tầng 3", IsActive = true, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) });
        });
    }


//  labtest
public DbSet<LabTestType> LabTestTypes { get; set; }
>>>>>>> origin/main
}

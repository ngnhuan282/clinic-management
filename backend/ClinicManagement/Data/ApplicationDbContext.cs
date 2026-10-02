using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;
using ClinicManagement.Commons;

namespace ClinicManagement.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RbacAudit> RbacAudits => Set<RbacAudit>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<DoctorSchedule> DoctorSchedules => Set<DoctorSchedule>();
    public DbSet<DoctorScheduleRequest> DoctorScheduleRequests => Set<DoctorScheduleRequest>();
    public DbSet<TimeSlot> TimeSlots => Set<TimeSlot>();

    public DbSet<User> Users => Set<User>();

    public DbSet<PatientBook> PatientBooks => Set<PatientBook>();

    public DbSet<Department> Departments => Set<Department>();

    public DbSet<Specialization> Specializations => Set<Specialization>();

    public DbSet<Room> Rooms => Set<Room>();

    public DbSet<Doctor> Doctors => Set<Doctor>();

    public DbSet<Appointment> Appointments => Set<Appointment>();

    public DbSet<MedicineCategory> MedicineCategories =>
        Set<MedicineCategory>();

    public DbSet<Supplier> Suppliers => Set<Supplier>();

    public DbSet<Medicine> Medicines => Set<Medicine>();

    public DbSet<Inventory> Inventory => Set<Inventory>();

    public DbSet<LabTestType> LabTestTypes { get; set; }

    public DbSet<LabTest> LabTests { get; set; }
    public DbSet<LabTestResult> LabTestResults { get; set; }
    public DbSet<Disease> Diseases => Set<Disease>();

    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();

    public DbSet<RecordDiagnosis> RecordDiagnoses =>
        Set<RecordDiagnosis>();

    public DbSet<Prescription> Prescriptions => Set<Prescription>();

    public DbSet<PrescriptionDetail> PrescriptionDetails =>
        Set<PrescriptionDetail>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.Property(x => x.TokenHash).HasMaxLength(64).IsRequired();
            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.Property(x => x.Version).IsRowVersion();
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

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
            entity.Property(x => x.Version).IsRowVersion();

            entity.HasData(
                new Role
                {
                    RoleId = 1,
                    RoleName = "Admin",
                    Description = "System administrator", IsSystem = true
                },
                new Role
                {
                    RoleId = 2,
                    RoleName = "Doctor",
                    Description = "Doctor", IsSystem = true
                },
                new Role
                {
                    RoleId = 3,
                    RoleName = "Receptionist",
                    Description = "Receptionist", IsSystem = true
                },
                new Role
                {
                    RoleId = 4,
                    RoleName = "Patient",
                    Description = "Patient", IsSystem = true
                },
                new Role
                {
                    RoleId = 5,
                    RoleName = "LabTechnician",
                    Description = "Lab technician", IsSystem = true
                }
            );
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(x => x.Code);
            entity.Property(x => x.Code).HasMaxLength(80);
            entity.Property(x => x.Module).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Kind).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Scope).HasMaxLength(250);
            entity.HasData(PermissionCatalog.All.Select(x => new Permission
            {
                Code = x.Code, Module = x.Module, Name = x.Name, Kind = x.Kind,
                Scope = x.Scope, IsImplemented = x.IsImplemented
            }));
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(x => new { x.RoleId, x.PermissionCode });
            entity.Property(x => x.PermissionCode).HasMaxLength(80);
            entity.HasOne(x => x.Role).WithMany(x => x.RolePermissions).HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Permission).WithMany(x => x.RolePermissions).HasForeignKey(x => x.PermissionCode)
                .OnDelete(DeleteBehavior.Restrict);
            var roleIds = new Dictionary<string, int>
            {
                [RoleConstants.Admin] = 1, [RoleConstants.Doctor] = 2,
                [RoleConstants.Receptionist] = 3, [RoleConstants.Patient] = 4,
                [RoleConstants.LabTechnician] = 5
            };
            entity.HasData(PermissionCatalog.DefaultRoles.Where(role => role.Key != RoleConstants.DepartmentHead)
                .SelectMany(role => role.Value.Select(code =>
                new RolePermission { RoleId = roleIds[role.Key], PermissionCode = code })));
        });

        modelBuilder.Entity<RbacAudit>(entity =>
        {
            entity.HasKey(x => x.RbacAuditId);
            entity.Property(x => x.Action).HasMaxLength(60).IsRequired();
            entity.Property(x => x.EntityType).HasMaxLength(40).IsRequired();
            entity.Property(x => x.BeforeJson).HasColumnType("nvarchar(max)");
            entity.Property(x => x.AfterJson).HasColumnType("nvarchar(max)");
            entity.HasIndex(x => x.CreatedAt);
            entity.HasOne<User>().WithMany().HasForeignKey(x => x.ActorUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Doctor>(entity =>
        {
            entity.HasIndex(x => x.UserId).IsUnique().HasFilter("[UserId] IS NOT NULL");
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DoctorScheduleRequest>(entity =>
        {
            entity.HasKey(x => x.RequestId);
            entity.Property(x => x.WorkDate).HasColumnType("date");
            entity.Property(x => x.Status).HasMaxLength(20).IsRequired();
            entity.Property(x => x.RejectReason).HasMaxLength(200);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(x =>
            {
                x.HasCheckConstraint("CK_DoctorScheduleRequests_Time", "[StartTime] < [EndTime]");
                x.HasCheckConstraint("CK_DoctorScheduleRequests_Status", "[Status] IN ('Pending','Approved','Rejected','Cancelled')");
                x.HasCheckConstraint("CK_DoctorScheduleRequests_RejectReason", "[Status] <> 'Rejected' OR ([RejectReason] IS NOT NULL AND LEN(LTRIM(RTRIM([RejectReason]))) > 0)");
            });
            entity.HasIndex(x => new { x.DoctorId, x.WorkDate, x.Status });
            entity.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Room).WithMany().HasForeignKey(x => x.RoomId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Reviewer).WithMany().HasForeignKey(x => x.ReviewerId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Schedule).WithOne(x => x.Request).HasForeignKey<DoctorSchedule>(x => x.RequestId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<DoctorSchedule>(entity =>
        {
            entity.Property(x => x.WorkDate).HasColumnType("date");
            entity.HasIndex(x => x.RequestId).IsUnique().HasFilter("[RequestId] IS NOT NULL");
            entity.HasIndex(x => new { x.DoctorId, x.WorkDate, x.StartTime });
            entity.HasIndex(x => new { x.RoomId, x.WorkDate, x.StartTime });
        });

        // =========================
        // User
        // =========================
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.UserId);
            entity.Property(x => x.SecurityVersion).IsConcurrencyToken();

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

        modelBuilder.Entity<PatientBook>(entity =>
        {
            entity.HasKey(x => x.PatientBookId);

            entity.Property(x => x.BookNumber)
                .HasMaxLength(30);

            entity.Property(x => x.Status)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("GETDATE()");

            entity.Property(x => x.UpdatedAt)
                .HasDefaultValueSql("GETDATE()");

            entity.HasIndex(x => x.BookNumber)
                .IsUnique()
                .HasFilter("[BookNumber] IS NOT NULL");

            entity.HasIndex(x => x.PatientId)
                .IsUnique()
                .HasFilter("[PatientId] IS NOT NULL AND [Status] = 'Issued'");

            entity.HasOne(x => x.Patient)
                .WithMany()
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.PreviousBook)
                .WithMany()
                .HasForeignKey(x => x.PreviousBookId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasOne(x => x.PatientBook)
                .WithMany()
                .HasForeignKey(x => x.PatientBookId)
                .OnDelete(DeleteBehavior.Restrict);
        });

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

        // =========================
        // Medicine Category
        // =========================
        modelBuilder.Entity<MedicineCategory>(entity =>
        {
            entity.HasKey(x => x.CategoryId);

            entity.Property(x => x.CategoryName)
                .HasMaxLength(100)
                .IsRequired();

            entity.HasIndex(x => x.CategoryName)
                .IsUnique();
        });

        // =========================
        // Supplier
        // =========================
        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.HasKey(x => x.SupplierId);

            entity.Property(x => x.SupplierName)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.ContactInfo)
                .HasMaxLength(100);

            entity.Property(x => x.Address)
                .HasMaxLength(255);
        });

        // =========================
        // Medicine
        // =========================
        modelBuilder.Entity<Medicine>(entity =>
        {
            entity.HasKey(x => x.MedicineId);

            entity.Property(x => x.MedicineName)
                .HasMaxLength(150)
                .IsRequired();

            entity.HasIndex(x => x.MedicineName)
                .IsUnique();

            entity.Property(x => x.Unit)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(x => x.UnitPrice)
                .HasPrecision(18, 2);

            entity.Property(x => x.Description)
                .HasMaxLength(255);

            entity.HasOne(x => x.Category)
                .WithMany(x => x.Medicines)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Supplier)
                .WithMany(x => x.Medicines)
                .HasForeignKey(x => x.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // =========================
        // Inventory
        // =========================
        modelBuilder.Entity<Inventory>(entity =>
        {
            entity.HasKey(x => x.InventoryId);

            entity.Property(x => x.BatchNumber)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.ExpiryDate)
                .HasColumnType("date");

            entity.HasIndex(x => new
            {
                x.MedicineId,
                x.BatchNumber,
                x.ExpiryDate
            })
            .IsUnique();

            entity.ToTable(x =>
                x.HasCheckConstraint(
                    "CK_Inventory_QuantityInStock",
                    "[QuantityInStock] >= 0"
                )
            );

            entity.HasOne(x => x.Medicine)
                .WithMany(x => x.Inventories)
                .HasForeignKey(x => x.MedicineId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // =========================
        // Disease
        // =========================
        modelBuilder.Entity<Disease>(entity =>
        {
            entity.HasKey(x => x.DiseaseId);

            entity.Property(x => x.DiseaseCode)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.DiseaseName)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasMaxLength(500);

            entity.Property(x => x.IsActive)
                .HasDefaultValue(true);

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("GETDATE()");

            entity.HasIndex(x => x.DiseaseCode)
                .IsUnique();

            entity.HasIndex(x => x.DiseaseName)
                .IsUnique();

            entity.HasData(
                new Disease
                {
                    DiseaseId = 1,
                    DiseaseCode = "I10",
                    DiseaseName = "Tăng huyết áp",
                    Description = "Tăng huyết áp nguyên phát",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1)
                },
                new Disease
                {
                    DiseaseId = 2,
                    DiseaseCode = "E11",
                    DiseaseName = "Đái tháo đường type 2",
                    Description = "Đái tháo đường không phụ thuộc insulin",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1)
                },
                new Disease
                {
                    DiseaseId = 3,
                    DiseaseCode = "J06",
                    DiseaseName = "Nhiễm khuẩn hô hấp trên cấp",
                    Description = "Viêm đường hô hấp trên cấp",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1)
                }
            );
        });

        // =========================
        // Medical Record
        // =========================
        modelBuilder.Entity<MedicalRecord>(entity =>
        {
            entity.HasKey(x => x.MedicalRecordId);

            entity.Property(x => x.ExaminationDate)
                .HasColumnType("date");

            entity.Property(x => x.Symptoms)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(x => x.Conclusion)
                .HasMaxLength(1000);

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("GETDATE()");

            entity.Property(x => x.UpdatedAt)
                .HasDefaultValueSql("GETDATE()");

            entity.HasIndex(x => x.AppointmentId)
                .IsUnique();

            entity.HasOne(x => x.Appointment)
                .WithOne(x => x.MedicalRecord)
                .HasForeignKey<MedicalRecord>(x => x.AppointmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Doctor)
                .WithMany(x => x.MedicalRecords)
                .HasForeignKey(x => x.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Patient)
                .WithMany(x => x.MedicalRecords)
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.PatientBook)
                .WithMany()
                .HasForeignKey(x => x.PatientBookId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // =========================
        // Record Diagnosis
        // =========================
        modelBuilder.Entity<RecordDiagnosis>(entity =>
        {
            entity.HasKey(x => x.RecordDiagnosisId);

            entity.Property(x => x.Note)
                .HasMaxLength(500);

            entity.HasIndex(x => new
            {
                x.MedicalRecordId,
                x.DiseaseId
            })
            .IsUnique();

            entity.HasOne(x => x.MedicalRecord)
                .WithMany(x => x.Diagnoses)
                .HasForeignKey(x => x.MedicalRecordId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Disease)
                .WithMany(x => x.RecordDiagnoses)
                .HasForeignKey(x => x.DiseaseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // =========================
        // Prescription
        // =========================
        modelBuilder.Entity<Prescription>(entity =>
        {
            entity.HasKey(x => x.PrescriptionId);

            entity.Property(x => x.PrescriptionDate)
                .HasDefaultValueSql("GETDATE()");

            entity.Property(x => x.Status)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(x => x.Notes)
                .HasMaxLength(1000);

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("GETDATE()");

            entity.Property(x => x.UpdatedAt)
                .HasDefaultValueSql("GETDATE()");

            entity.HasIndex(x => x.MedicalRecordId)
                .IsUnique();

            entity.HasOne(x => x.MedicalRecord)
                .WithOne(x => x.Prescription)
                .HasForeignKey<Prescription>(x => x.MedicalRecordId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // =========================
        // Prescription Detail
        // =========================
        modelBuilder.Entity<PrescriptionDetail>(entity =>
        {
            entity.HasKey(x => x.PrescriptionDetailId);

            entity.Property(x => x.Dosage)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Instructions)
                .HasMaxLength(255)
                .IsRequired();

            entity.HasIndex(x => new
            {
                x.PrescriptionId,
                x.MedicineId
            })
            .IsUnique();

            entity.ToTable(x =>
                x.HasCheckConstraint(
                    "CK_PrescriptionDetails_Quantity",
                    "[Quantity] > 0"
                )
            );

            entity.HasOne(x => x.Prescription)
                .WithMany(x => x.Details)
                .HasForeignKey(x => x.PrescriptionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Medicine)
                .WithMany(x => x.PrescriptionDetails)
                .HasForeignKey(x => x.MedicineId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}

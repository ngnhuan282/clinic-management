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
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<DoctorSchedule> DoctorSchedules => Set<DoctorSchedule>();

    public DbSet<User> Users => Set<User>();

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
    }
}

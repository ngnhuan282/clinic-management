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

    public DbSet<MedicineCategory> MedicineCategories =>
        Set<MedicineCategory>();

    public DbSet<Supplier> Suppliers => Set<Supplier>();

    public DbSet<Medicine> Medicines => Set<Medicine>();

    public DbSet<Inventory> Inventory => Set<Inventory>();

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

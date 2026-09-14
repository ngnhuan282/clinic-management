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
    }
}
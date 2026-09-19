using ClinicManagement.Repositories.Implementations;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Implementations;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Configurations;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services)
    {
        services.AddHttpContextAccessor();

        // =========================
        // Common / Security
        // =========================
        services.AddScoped<
            IPasswordHasherService,
            PasswordHasherService
        >();

        services.AddScoped<
            IJwtTokenGenerator,
            JwtTokenGenerator
        >();

        services.AddScoped<
            ICurrentUserService,
            CurrentUserService
        >();

        services.AddScoped<
            IBookingService,
            BookingService
        >();

        services.AddScoped<
            IRefreshTokenGenerator,
            RefreshTokenGenerator
        >();

        // =========================
        // Repositories
        // =========================
        services.AddScoped<
            IUserRepository,
            UserRepository
        >();

        services.AddScoped<
            IRoleRepository,
            RoleRepository
        >();
        services.AddScoped<IDepartmentRepository, DepartmentRepository>();
        services.AddScoped<ISpecializationRepository, SpecializationRepository>();
        services.AddScoped<IRoomRepository, RoomRepository>();

        services.AddScoped<
            IDoctorRepository,
            DoctorRepository
        >();

        services.AddScoped<
            IAppointmentRepository,
            AppointmentRepository
        >();

        services.AddScoped<
            IMedicineRepository,
            MedicineRepository
        >();

        services.AddScoped<
            IMedicineCategoryRepository,
            MedicineCategoryRepository
        >();

        services.AddScoped<
            ISupplierRepository,
            SupplierRepository
        >();

        services.AddScoped<
            IInventoryRepository,
            InventoryRepository
        >();

        // =========================
        // Business Services
        // =========================
        services.AddScoped<
            IAuthService,
            AuthService
        >();
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<ISpecializationService, SpecializationService>();
        services.AddScoped<IRoomService, RoomService>();

        services.AddScoped<
            IMedicineService,
            MedicineService
        >();

        services.AddScoped<
            IMedicineCategoryService,
            MedicineCategoryService
        >();

        services.AddScoped<
            ISupplierService,
            SupplierService
        >();

        services.AddScoped<
            IInventoryService,
            InventoryService
        >();

        return services;
    }
}

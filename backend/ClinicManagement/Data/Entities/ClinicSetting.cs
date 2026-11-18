namespace ClinicManagement.Data.Entities;

public class ClinicSetting
{
    public const decimal DefaultExamFee = 150000m;
    public const decimal DefaultBookFee = 10000m;
    public const int DefaultSlotMinutes = 30;
    public const int DefaultSlotCapacity = 1;
    public const int DefaultLowStock = 10;
    public const int DefaultExpiryDays = 30;

    public int ClinicSettingId { get; set; }
    public string ClinicName { get; set; } = "Clinic Management System";
    public string Tagline { get; set; } = "Hệ thống quản lý phòng khám đa khoa";
    public string Description { get; set; } =
        "Kết nối người bệnh với các chuyên khoa, bác sĩ uy tín và dịch vụ y tế chuẩn mực. Lựa chọn giờ khám và nhận hỗ trợ nhanh chóng.";
    public string Phone { get; set; } = "1900 6868";
    public string Email { get; set; } = "contact@medclinic-system.vn";
    public string WorkingHours { get; set; } = "07:30 – 20:00, Thứ Hai – Chủ Nhật";
    public string PrimaryLocationName { get; set; } = "Cơ sở TP. Hồ Chí Minh";
    public string PrimaryLocationAddress { get; set; } = "128 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh";
    public string? SecondaryLocationName { get; set; } = "Cơ sở Hà Nội";
    public string? SecondaryLocationAddress { get; set; } = "54 Tràng Thi, Hoàn Kiếm, Hà Nội";
    public decimal DefaultExaminationFee { get; set; } = DefaultExamFee;
    public decimal PatientBookFee { get; set; } = DefaultBookFee;
    public int DefaultSlotDurationMinutes { get; set; } = DefaultSlotMinutes;
    public int DefaultMaxPatientsPerSlot { get; set; } = DefaultSlotCapacity;
    public int LowStockThreshold { get; set; } = DefaultLowStock;
    public int NearExpiryDays { get; set; } = DefaultExpiryDays;
    public DateTime UpdatedAt { get; set; }
    public int? UpdatedByUserId { get; set; }
    public User? UpdatedByUser { get; set; }

    public static ClinicSetting CreateSeed() => new()
    {
        ClinicSettingId = 1,
        UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
    };
}

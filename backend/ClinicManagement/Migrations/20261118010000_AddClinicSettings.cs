using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ClinicManagement.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261118010000_AddClinicSettings")]
public sealed class AddClinicSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "ClinicSettings",
            columns: table => new
            {
                ClinicSettingId = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                ClinicName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                Tagline = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Description = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: false),
                Phone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                WorkingHours = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                PrimaryLocationName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                PrimaryLocationAddress = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                SecondaryLocationName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                SecondaryLocationAddress = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                DefaultExaminationFee = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                PatientBookFee = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                DefaultSlotDurationMinutes = table.Column<int>(type: "int", nullable: false),
                DefaultMaxPatientsPerSlot = table.Column<int>(type: "int", nullable: false),
                LowStockThreshold = table.Column<int>(type: "int", nullable: false),
                NearExpiryDays = table.Column<int>(type: "int", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                UpdatedByUserId = table.Column<int>(type: "int", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ClinicSettings", x => x.ClinicSettingId);
                table.CheckConstraint("CK_ClinicSettings_DefaultExaminationFee", "[DefaultExaminationFee] > 0");
                table.CheckConstraint("CK_ClinicSettings_PatientBookFee", "[PatientBookFee] > 0");
                table.CheckConstraint("CK_ClinicSettings_SlotDuration", "[DefaultSlotDurationMinutes] IN (15, 20, 30)");
                table.CheckConstraint("CK_ClinicSettings_MaxPatientsPerSlot", "[DefaultMaxPatientsPerSlot] BETWEEN 1 AND 20");
                table.CheckConstraint("CK_ClinicSettings_LowStockThreshold", "[LowStockThreshold] >= 1");
                table.CheckConstraint("CK_ClinicSettings_NearExpiryDays", "[NearExpiryDays] >= 1");
                table.ForeignKey(
                    name: "FK_ClinicSettings_Users_UpdatedByUserId",
                    column: x => x.UpdatedByUserId,
                    principalTable: "Users",
                    principalColumn: "UserId",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_ClinicSettings_UpdatedByUserId",
            table: "ClinicSettings",
            column: "UpdatedByUserId");

        migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM dbo.ClinicSettings)
BEGIN
    SET IDENTITY_INSERT dbo.ClinicSettings ON;
    INSERT INTO dbo.ClinicSettings (
        ClinicSettingId, ClinicName, Tagline, Description,
        Phone, Email, WorkingHours,
        PrimaryLocationName, PrimaryLocationAddress,
        SecondaryLocationName, SecondaryLocationAddress,
        DefaultExaminationFee, PatientBookFee,
        DefaultSlotDurationMinutes, DefaultMaxPatientsPerSlot,
        LowStockThreshold, NearExpiryDays, UpdatedAt, UpdatedByUserId
    )
    VALUES (
        1,
        N'Clinic Management System',
        N'Hệ thống quản lý phòng khám đa khoa',
        N'Kết nối người bệnh với các chuyên khoa, bác sĩ uy tín và dịch vụ y tế chuẩn mực. Lựa chọn giờ khám và nhận hỗ trợ nhanh chóng.',
        N'1900 6868',
        N'contact@medclinic-system.vn',
        N'07:30 – 20:00, Thứ Hai – Chủ Nhật',
        N'Cơ sở TP. Hồ Chí Minh',
        N'128 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
        N'Cơ sở Hà Nội',
        N'54 Tràng Thi, Hoàn Kiếm, Hà Nội',
        150000.00,
        10000.00,
        30,
        1,
        10,
        30,
        '2026-01-01T00:00:00Z',
        NULL
    );
    SET IDENTITY_INSERT dbo.ClinicSettings OFF;
END;

UPDATE Specializations
SET Description = N'Khám, tầm soát và theo dõi các bệnh lý nội khoa thường gặp ở người lớn, tư vấn phác đồ điều trị và chăm sóc sức khỏe định kỳ.'
WHERE Code = N'NỘI-TQ' AND (Description IS NULL OR LEN(LTRIM(RTRIM(Description))) = 0);

UPDATE Specializations
SET Description = N'Khám bệnh lý hô hấp, tiêu hóa, dinh dưỡng và theo dõi phát triển thể chất toàn diện cho trẻ sơ sinh và trẻ nhỏ.'
WHERE Code = N'NHI-KHOA' AND (Description IS NULL OR LEN(LTRIM(RTRIM(Description))) = 0);

UPDATE Specializations
SET Description = N'Khám răng miệng tổng quát, điều trị bệnh lý răng nướu và tư vấn dự phòng nha khoa cho trẻ em và người lớn.'
WHERE Code = N'RHM-NQ' AND (Description IS NULL OR LEN(LTRIM(RTRIM(Description))) = 0);
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "ClinicSettings");
    }
}

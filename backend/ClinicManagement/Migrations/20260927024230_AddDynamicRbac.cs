using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddDynamicRbac : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSystem",
                table: "Roles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Roles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "Version",
                table: "Roles",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Doctors",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Module = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    Kind = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Scope = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    IsImplemented = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissions", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "RbacAudits",
                columns: table => new
                {
                    RbacAuditId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActorUserId = table.Column<int>(type: "int", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    EntityId = table.Column<int>(type: "int", nullable: false),
                    BeforeJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AfterJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RbacAudits", x => x.RbacAuditId);
                    table.ForeignKey(
                        name: "FK_RbacAudits_Users_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RolePermissions",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    PermissionCode = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => new { x.RoleId, x.PermissionCode });
                    table.ForeignKey(
                        name: "FK_RolePermissions_Permissions_PermissionCode",
                        column: x => x.PermissionCode,
                        principalTable: "Permissions",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Doctors",
                keyColumn: "DoctorId",
                keyValue: 1,
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Doctors",
                keyColumn: "DoctorId",
                keyValue: 2,
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Doctors",
                keyColumn: "DoctorId",
                keyValue: 3,
                column: "UserId",
                value: null);

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Code", "IsImplemented", "Kind", "Module", "Name", "Scope" },
                values: new object[,]
                {
                    { "accounts.assignRole", true, "Phân quyền", "Tài khoản", "Gán vai trò", null },
                    { "accounts.create", false, "Tạo", "Tài khoản", "Tạo tài khoản nhân viên", null },
                    { "accounts.manageRoles", true, "Phân quyền", "Tài khoản", "Quản lý vai trò và quyền", null },
                    { "accounts.update", true, "Sửa", "Tài khoản", "Khóa hoặc mở khóa tài khoản", null },
                    { "accounts.view", true, "Xem", "Tài khoản", "Xem tài khoản", null },
                    { "appointments.bookSelf", true, "Tạo", "Lịch hẹn", "Đặt lịch cho bản thân", "Chỉ tạo lịch của bệnh nhân đăng nhập" },
                    { "appointments.cancelOwn", false, "Nghiệp vụ", "Lịch hẹn", "Hủy lịch của bản thân", null },
                    { "appointments.checkIn", false, "Nghiệp vụ", "Lịch hẹn", "Check-in bệnh nhân", null },
                    { "appointments.confirm", true, "Nghiệp vụ", "Lịch hẹn", "Xác nhận lịch", null },
                    { "appointments.createWalkIn", true, "Tạo", "Lịch hẹn", "Tiếp nhận walk-in", null },
                    { "appointments.reschedule", true, "Nghiệp vụ", "Lịch hẹn", "Đổi hoặc hủy lịch", null },
                    { "appointments.startExamination", true, "Nghiệp vụ", "Lịch hẹn", "Bắt đầu khám", null },
                    { "appointments.view", true, "Xem", "Lịch hẹn", "Xem lịch tiếp nhận", null },
                    { "appointments.viewOwn", false, "Xem", "Lịch hẹn", "Xem lịch của bản thân", "Chỉ lịch của bệnh nhân đăng nhập" },
                    { "billing.create", false, "Tạo", "Hóa đơn và thanh toán", "Lập hóa đơn", null },
                    { "billing.recordPayment", false, "Nghiệp vụ", "Hóa đơn và thanh toán", "Ghi nhận thanh toán", null },
                    { "billing.view", false, "Xem", "Hóa đơn và thanh toán", "Xem hóa đơn", "Theo công việc được giao" },
                    { "billing.viewOwn", false, "Xem", "Hóa đơn và thanh toán", "Xem hóa đơn bản thân", "Chỉ hóa đơn của bệnh nhân đăng nhập" },
                    { "catalog.manage", true, "Sửa", "Danh mục", "Quản lý khoa, chuyên khoa và phòng", null },
                    { "clinical.editDiagnosis", true, "Sửa", "Khám bệnh", "Cập nhật chẩn đoán", null },
                    { "clinical.manageDiseases", true, "Sửa", "Khám bệnh", "Quản lý danh mục bệnh", null },
                    { "clinical.viewAssigned", true, "Xem", "Khám bệnh", "Xem hồ sơ trong phạm vi được giao", "Chỉ hồ sơ thuộc lượt khám được giao" },
                    { "clinical.viewOwn", false, "Xem", "Khám bệnh", "Xem bệnh án bản thân", "Chỉ hồ sơ của bệnh nhân đăng nhập" },
                    { "clinical.writeRecord", true, "Tạo", "Khám bệnh", "Lập bệnh án", null },
                    { "labs.enterResult", true, "Nghiệp vụ", "Xét nghiệm", "Nhập kết quả", null },
                    { "labs.manageTypes", true, "Sửa", "Xét nghiệm", "Quản lý loại xét nghiệm", null },
                    { "labs.order", true, "Tạo", "Xét nghiệm", "Chỉ định xét nghiệm", null },
                    { "labs.start", false, "Nghiệp vụ", "Xét nghiệm", "Nhận thực hiện xét nghiệm", null },
                    { "labs.viewOrders", true, "Xem", "Xét nghiệm", "Xem chỉ định và kết quả", "Theo phạm vi công việc hoặc bệnh nhân" },
                    { "labs.viewOwnResult", true, "Xem", "Xét nghiệm", "Xem kết quả bản thân", "Chỉ kết quả của bệnh nhân đăng nhập" },
                    { "labs.viewPending", true, "Xem", "Xét nghiệm", "Xem hàng chờ thực hiện", null },
                    { "labs.viewTypes", true, "Xem", "Xét nghiệm", "Xem loại xét nghiệm", null },
                    { "pharmacy.dispense", false, "Nghiệp vụ", "Đơn thuốc và kho", "Xác nhận cấp thuốc", null },
                    { "pharmacy.manageCatalog", true, "Sửa", "Đơn thuốc và kho", "Quản lý danh mục thuốc", null },
                    { "pharmacy.manageInventory", true, "Sửa", "Đơn thuốc và kho", "Nhập và điều chỉnh tồn", null },
                    { "pharmacy.prescribe", false, "Tạo", "Đơn thuốc và kho", "Kê đơn", null },
                    { "pharmacy.viewCatalog", true, "Xem", "Đơn thuốc và kho", "Xem danh mục thuốc", null },
                    { "pharmacy.viewInventory", true, "Xem", "Đơn thuốc và kho", "Xem tồn kho", null },
                    { "pharmacy.viewOwnPrescription", false, "Xem", "Đơn thuốc và kho", "Xem đơn thuốc bản thân", null },
                    { "reports.operations", false, "Xem", "Báo cáo", "Xem báo cáo lượt khám", null },
                    { "reports.revenue", false, "Xem", "Báo cáo", "Xem báo cáo doanh thu", null },
                    { "schedules.manage", true, "Tạo", "Lịch bác sĩ", "Tạo lịch bác sĩ", null }
                });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 1,
                columns: new[] { "IsSystem", "UpdatedAt" },
                values: new object[] { true, null });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 2,
                columns: new[] { "IsSystem", "UpdatedAt" },
                values: new object[] { true, null });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 3,
                columns: new[] { "IsSystem", "UpdatedAt" },
                values: new object[] { true, null });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 4,
                columns: new[] { "IsSystem", "UpdatedAt" },
                values: new object[] { true, null });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 5,
                columns: new[] { "IsSystem", "UpdatedAt" },
                values: new object[] { true, null });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionCode", "RoleId" },
                values: new object[,]
                {
                    { "accounts.assignRole", 1 },
                    { "accounts.create", 1 },
                    { "accounts.manageRoles", 1 },
                    { "accounts.update", 1 },
                    { "accounts.view", 1 },
                    { "appointments.checkIn", 1 },
                    { "appointments.confirm", 1 },
                    { "appointments.createWalkIn", 1 },
                    { "appointments.reschedule", 1 },
                    { "appointments.startExamination", 1 },
                    { "appointments.view", 1 },
                    { "billing.create", 1 },
                    { "billing.recordPayment", 1 },
                    { "billing.view", 1 },
                    { "catalog.manage", 1 },
                    { "clinical.editDiagnosis", 1 },
                    { "clinical.manageDiseases", 1 },
                    { "clinical.viewAssigned", 1 },
                    { "clinical.writeRecord", 1 },
                    { "labs.manageTypes", 1 },
                    { "labs.start", 1 },
                    { "labs.viewOrders", 1 },
                    { "labs.viewTypes", 1 },
                    { "pharmacy.dispense", 1 },
                    { "pharmacy.manageCatalog", 1 },
                    { "pharmacy.manageInventory", 1 },
                    { "pharmacy.prescribe", 1 },
                    { "pharmacy.viewCatalog", 1 },
                    { "pharmacy.viewInventory", 1 },
                    { "reports.operations", 1 },
                    { "reports.revenue", 1 },
                    { "schedules.manage", 1 },
                    { "appointments.startExamination", 2 },
                    { "clinical.editDiagnosis", 2 },
                    { "clinical.manageDiseases", 2 },
                    { "clinical.viewAssigned", 2 },
                    { "clinical.writeRecord", 2 },
                    { "labs.order", 2 },
                    { "labs.viewOrders", 2 },
                    { "labs.viewTypes", 2 },
                    { "pharmacy.prescribe", 2 },
                    { "pharmacy.viewInventory", 2 },
                    { "appointments.checkIn", 3 },
                    { "appointments.confirm", 3 },
                    { "appointments.createWalkIn", 3 },
                    { "appointments.reschedule", 3 },
                    { "appointments.view", 3 },
                    { "billing.create", 3 },
                    { "billing.recordPayment", 3 },
                    { "billing.view", 3 },
                    { "pharmacy.dispense", 3 },
                    { "appointments.bookSelf", 4 },
                    { "appointments.cancelOwn", 4 },
                    { "appointments.viewOwn", 4 },
                    { "billing.viewOwn", 4 },
                    { "clinical.viewOwn", 4 },
                    { "labs.viewOrders", 4 },
                    { "labs.viewOwnResult", 4 },
                    { "pharmacy.viewOwnPrescription", 4 },
                    { "labs.enterResult", 5 },
                    { "labs.start", 5 },
                    { "labs.viewOrders", 5 },
                    { "labs.viewPending", 5 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_UserId",
                table: "Doctors",
                column: "UserId",
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_RbacAudits_ActorUserId",
                table: "RbacAudits",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RbacAudits_CreatedAt",
                table: "RbacAudits",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_PermissionCode",
                table: "RolePermissions",
                column: "PermissionCode");

            migrationBuilder.AddForeignKey(
                name: "FK_Doctors_Users_UserId",
                table: "Doctors",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Doctors_Users_UserId",
                table: "Doctors");

            migrationBuilder.DropTable(
                name: "RbacAudits");

            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropIndex(
                name: "IX_Doctors_UserId",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "IsSystem",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Doctors");
        }
    }
}

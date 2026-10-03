using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduleReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeSpan>(
                name: "EndTime",
                table: "DoctorSchedules",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.AddColumn<int>(
                name: "RequestId",
                table: "DoctorSchedules",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "StartTime",
                table: "DoctorSchedules",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.CreateTable(
                name: "DoctorScheduleRequests",
                columns: table => new
                {
                    RequestId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DoctorId = table.Column<int>(type: "int", nullable: false),
                    WorkDate = table.Column<DateOnly>(type: "date", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    RoomId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ReviewerId = table.Column<int>(type: "int", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectReason = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoctorScheduleRequests", x => x.RequestId);
                    table.CheckConstraint("CK_DoctorScheduleRequests_RejectReason", "[Status] <> 'Rejected' OR ([RejectReason] IS NOT NULL AND LEN(LTRIM(RTRIM([RejectReason]))) > 0)");
                    table.CheckConstraint("CK_DoctorScheduleRequests_Status", "[Status] IN ('Pending','Approved','Rejected','Cancelled')");
                    table.CheckConstraint("CK_DoctorScheduleRequests_Time", "[StartTime] < [EndTime]");
                    table.ForeignKey(
                        name: "FK_DoctorScheduleRequests_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "DoctorId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DoctorScheduleRequests_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "RoomId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DoctorScheduleRequests_Users_ReviewerId",
                        column: x => x.ReviewerId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.Sql(@"
UPDATE s SET StartTime = t.StartTime, EndTime = t.EndTime
FROM DoctorSchedules s
JOIN (SELECT ScheduleId, MIN(StartTime) AS StartTime, MAX(EndTime) AS EndTime
      FROM TimeSlots GROUP BY ScheduleId) t ON t.ScheduleId = s.ScheduleId;

DECLARE @Migrated TABLE (ScheduleId uniqueidentifier PRIMARY KEY, RequestId int NOT NULL);
MERGE DoctorScheduleRequests AS target
USING (SELECT ScheduleId, DoctorId, RoomId, WorkDate, StartTime, EndTime, CreatedAt
       FROM DoctorSchedules WHERE StartTime < EndTime) AS source
ON 1 = 0
WHEN NOT MATCHED THEN
    INSERT (DoctorId, RoomId, WorkDate, StartTime, EndTime, Status, CreatedAt)
    VALUES (source.DoctorId, source.RoomId, source.WorkDate, source.StartTime, source.EndTime, 'Approved', source.CreatedAt)
OUTPUT source.ScheduleId, inserted.RequestId INTO @Migrated;

UPDATE s SET RequestId = m.RequestId
FROM DoctorSchedules s JOIN @Migrated m ON m.ScheduleId = s.ScheduleId;
");

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Code", "IsImplemented", "Kind", "Module", "Name", "Scope" },
                values: new object[] { "schedules.review", true, "Duyệt", "Lịch bác sĩ", "Duyệt ca khám", "Theo khoa hoặc yêu cầu của Trưởng khoa" });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionCode", "RoleId" },
                values: new object[] { "schedules.review", 1 });

            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'DepartmentHead')
    INSERT INTO Roles (RoleName, Description, IsSystem)
    VALUES ('DepartmentHead', 'Department head and doctor', 1);
ELSE
    UPDATE Roles SET IsSystem = 1 WHERE RoleName = 'DepartmentHead';

DECLARE @HeadRoleId int = (SELECT RoleId FROM Roles WHERE RoleName = 'DepartmentHead');
INSERT INTO RolePermissions (RoleId, PermissionCode)
SELECT @HeadRoleId, p.Code FROM Permissions p
WHERE p.Code IN ('schedules.review','appointments.startExamination','clinical.viewAssigned',
                 'clinical.writeRecord','clinical.editDiagnosis','clinical.manageDiseases',
                 'pharmacy.viewInventory','pharmacy.viewCatalog','pharmacy.prescribe',
                 'labs.viewTypes','labs.viewOrders','labs.order')
  AND NOT EXISTS (SELECT 1 FROM RolePermissions rp
                  WHERE rp.RoleId = @HeadRoleId AND rp.PermissionCode = p.Code);
");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSchedules_DoctorId_WorkDate_StartTime",
                table: "DoctorSchedules",
                columns: new[] { "DoctorId", "WorkDate", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSchedules_RequestId",
                table: "DoctorSchedules",
                column: "RequestId",
                unique: true,
                filter: "[RequestId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSchedules_RoomId_WorkDate_StartTime",
                table: "DoctorSchedules",
                columns: new[] { "RoomId", "WorkDate", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_DoctorScheduleRequests_DoctorId_WorkDate_Status",
                table: "DoctorScheduleRequests",
                columns: new[] { "DoctorId", "WorkDate", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_DoctorScheduleRequests_ReviewerId",
                table: "DoctorScheduleRequests",
                column: "ReviewerId");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorScheduleRequests_RoomId",
                table: "DoctorScheduleRequests",
                column: "RoomId");

            migrationBuilder.AddForeignKey(
                name: "FK_DoctorSchedules_DoctorScheduleRequests_RequestId",
                table: "DoctorSchedules",
                column: "RequestId",
                principalTable: "DoctorScheduleRequests",
                principalColumn: "RequestId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DoctorSchedules_DoctorScheduleRequests_RequestId",
                table: "DoctorSchedules");

            migrationBuilder.DropTable(
                name: "DoctorScheduleRequests");

            migrationBuilder.DropIndex(
                name: "IX_DoctorSchedules_DoctorId_WorkDate_StartTime",
                table: "DoctorSchedules");

            migrationBuilder.DropIndex(
                name: "IX_DoctorSchedules_RequestId",
                table: "DoctorSchedules");

            migrationBuilder.DropIndex(
                name: "IX_DoctorSchedules_RoomId_WorkDate_StartTime",
                table: "DoctorSchedules");

            migrationBuilder.Sql(@"
DELETE FROM RolePermissions WHERE PermissionCode = 'schedules.review';
UPDATE Roles SET IsSystem = 0 WHERE RoleName = 'DepartmentHead';
DELETE FROM Roles WHERE RoleName = 'DepartmentHead'
  AND NOT EXISTS (SELECT 1 FROM Users WHERE Users.RoleId = Roles.RoleId);
");

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionCode", "RoleId" },
                keyValues: new object[] { "schedules.review", 1 });

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Code",
                keyValue: "schedules.review");

            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "DoctorSchedules");

            migrationBuilder.DropColumn(
                name: "RequestId",
                table: "DoctorSchedules");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "DoctorSchedules");
        }
    }
}

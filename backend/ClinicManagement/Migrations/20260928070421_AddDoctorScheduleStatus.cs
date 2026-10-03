using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddDoctorScheduleStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "DoctorSchedules",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Approved");
            migrationBuilder.AddCheckConstraint(
                name: "CK_DoctorSchedules_Status",
                table: "DoctorSchedules",
                sql: "[Status] IN ('Pending','Approved','Rejected')");
            migrationBuilder.AddColumn<Guid>(
                name: "TimeSlotId",
                table: "Appointments",
                type: "uniqueidentifier",
                nullable: true);
            migrationBuilder.CreateIndex(
                name: "IX_Appointments_TimeSlotId",
                table: "Appointments",
                column: "TimeSlotId");
            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_TimeSlots_TimeSlotId",
                table: "Appointments",
                column: "TimeSlotId",
                principalTable: "TimeSlots",
                principalColumn: "SlotId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint("CK_DoctorSchedules_Status", "DoctorSchedules");
            migrationBuilder.DropColumn("Status", "DoctorSchedules");
            migrationBuilder.DropForeignKey("FK_Appointments_TimeSlots_TimeSlotId", "Appointments");
            migrationBuilder.DropIndex("IX_Appointments_TimeSlotId", "Appointments");
            migrationBuilder.DropColumn("TimeSlotId", "Appointments");
        }
    }
}

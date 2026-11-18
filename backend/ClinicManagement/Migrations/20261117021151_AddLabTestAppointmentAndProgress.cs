using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddLabTestAppointmentAndProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AppointmentId",
                table: "LabTests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReceivedByTechnicianId",
                table: "LabTests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartedAt",
                table: "LabTests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LabTests_AppointmentId",
                table: "LabTests",
                column: "AppointmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_LabTests_Appointments_AppointmentId",
                table: "LabTests",
                column: "AppointmentId",
                principalTable: "Appointments",
                principalColumn: "AppointmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LabTests_Appointments_AppointmentId",
                table: "LabTests");

            migrationBuilder.DropIndex(
                name: "IX_LabTests_AppointmentId",
                table: "LabTests");

            migrationBuilder.DropColumn(
                name: "AppointmentId",
                table: "LabTests");

            migrationBuilder.DropColumn(
                name: "ReceivedByTechnicianId",
                table: "LabTests");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "LabTests");
        }
    }
}

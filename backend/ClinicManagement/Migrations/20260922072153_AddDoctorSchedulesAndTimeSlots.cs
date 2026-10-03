using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations;

public partial class AddDoctorSchedulesAndTimeSlots : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>("SpecializationId", "Doctors", nullable: false, defaultValue: 1);
        migrationBuilder.CreateIndex("IX_Doctors_SpecializationId", "Doctors", "SpecializationId");
        migrationBuilder.AddForeignKey(name: "FK_Doctors_Specializations_SpecializationId", table: "Doctors", column: "SpecializationId", principalTable: "Specializations", principalColumn: "SpecializationId", onDelete: ReferentialAction.Restrict);

        migrationBuilder.DropTable("DoctorSchedules");
        migrationBuilder.CreateTable(
            "DoctorSchedules",
            table => new
            {
                ScheduleId = table.Column<Guid>("uniqueidentifier", nullable: false),
                DoctorId = table.Column<int>("int", nullable: false),
                RoomId = table.Column<int>("int", nullable: false),
                WorkDate = table.Column<DateOnly>("date", nullable: false),
                Shift = table.Column<string>("nvarchar(20)", maxLength: 20, nullable: false),
                MaxPatients = table.Column<int>("int", nullable: false),
                IsActive = table.Column<bool>("bit", nullable: false, defaultValue: true),
                CreatedAt = table.Column<DateTime>("datetime2", nullable: false, defaultValueSql: "GETDATE()")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DoctorSchedules", x => x.ScheduleId);
                table.ForeignKey(name: "FK_DoctorSchedules_Doctors_DoctorId", x => x.DoctorId, principalTable: "Doctors", principalColumn: "DoctorId", onDelete: ReferentialAction.Restrict);
                table.ForeignKey(name: "FK_DoctorSchedules_Rooms_RoomId", x => x.RoomId, principalTable: "Rooms", principalColumn: "RoomId", onDelete: ReferentialAction.Restrict);
                table.CheckConstraint("CK_DoctorSchedules_MaxPatients", "[MaxPatients] > 0");
            });
        migrationBuilder.CreateIndex("IX_DoctorSchedules_DoctorId_WorkDate", "DoctorSchedules", new[] { "DoctorId", "WorkDate" });
        migrationBuilder.CreateIndex("IX_DoctorSchedules_RoomId_WorkDate", "DoctorSchedules", new[] { "RoomId", "WorkDate" });
        migrationBuilder.CreateTable(
            "TimeSlots",
            table => new
            {
                SlotId = table.Column<Guid>("uniqueidentifier", nullable: false),
                ScheduleId = table.Column<Guid>("uniqueidentifier", nullable: false),
                StartTime = table.Column<TimeSpan>("time", nullable: false),
                EndTime = table.Column<TimeSpan>("time", nullable: false),
                MaxCapacity = table.Column<int>("int", nullable: false, defaultValue: 1),
                CurrentBooked = table.Column<int>("int", nullable: false, defaultValue: 0),
                IsAvailable = table.Column<bool>("bit", nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TimeSlots", x => x.SlotId);
                table.ForeignKey(name: "FK_TimeSlots_DoctorSchedules_ScheduleId", x => x.ScheduleId, principalTable: "DoctorSchedules", principalColumn: "ScheduleId", onDelete: ReferentialAction.Cascade);
                table.CheckConstraint("CK_TimeSlots_Time", "[StartTime] < [EndTime]");
            });
        migrationBuilder.CreateIndex("IX_TimeSlots_ScheduleId_StartTime", "TimeSlots", new[] { "ScheduleId", "StartTime" }, unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("TimeSlots");
        migrationBuilder.DropTable("DoctorSchedules");
        migrationBuilder.DropForeignKey(name: "FK_Doctors_Specializations_SpecializationId", table: "Doctors");
        migrationBuilder.DropIndex("IX_Doctors_SpecializationId", "Doctors");
        migrationBuilder.DropColumn("SpecializationId", "Doctors");
        migrationBuilder.CreateTable("DoctorSchedules", table => new
        {
            DoctorScheduleId = table.Column<int>("int", nullable: false),
            DoctorId = table.Column<int>("int", nullable: false),
            DayOfWeek = table.Column<int>("int", nullable: false),
            StartTime = table.Column<TimeSpan>("time", nullable: false),
            EndTime = table.Column<TimeSpan>("time", nullable: false),
            IsActive = table.Column<bool>("bit", nullable: false)
        }, constraints: table => table.PrimaryKey("PK_DoctorSchedules", x => x.DoctorScheduleId));
    }
}

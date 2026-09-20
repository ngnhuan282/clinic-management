using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class CompleteWeek2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    RefreshTokenId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Version = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.RefreshTokenId);
                    table.ForeignKey("FK_RefreshTokens_Users_UserId", x => x.UserId, "Users", "UserId", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DoctorSchedules",
                columns: table => new
                {
                    DoctorScheduleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DoctorId = table.Column<int>(type: "int", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoctorSchedules", x => x.DoctorScheduleId);
                    table.CheckConstraint("CK_DoctorSchedules_Time", "[StartTime] < [EndTime] AND [DayOfWeek] BETWEEN 0 AND 6");
                    table.ForeignKey("FK_DoctorSchedules_Doctors_DoctorId", x => x.DoctorId, "Doctors", "DoctorId", onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "DoctorSchedules",
                columns: new[] { "DoctorScheduleId", "DayOfWeek", "DoctorId", "EndTime", "IsActive", "StartTime" },
                values: new object[,]
                {
                    { 1, 1, 1, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 2, 1, 1, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 3, 2, 1, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 4, 2, 1, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 5, 3, 1, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 6, 3, 1, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 7, 4, 1, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 8, 4, 1, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 9, 5, 1, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 10, 5, 1, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 11, 6, 1, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 12, 6, 1, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 13, 1, 2, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 14, 1, 2, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 15, 2, 2, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 16, 2, 2, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 17, 3, 2, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 18, 3, 2, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 19, 4, 2, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 20, 4, 2, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 21, 5, 2, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 22, 5, 2, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 23, 6, 2, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 24, 6, 2, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 25, 1, 3, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 26, 1, 3, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 27, 2, 3, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 28, 2, 3, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 29, 3, 3, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 30, 3, 3, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 31, 4, 3, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 32, 4, 3, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 33, 5, 3, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 34, 5, 3, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) },
                    { 35, 6, 3, new TimeSpan(0, 11, 30, 0, 0), true, new TimeSpan(0, 8, 0, 0, 0) },
                    { 36, 6, 3, new TimeSpan(0, 16, 30, 0, 0), true, new TimeSpan(0, 13, 30, 0, 0) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSchedules_DoctorId_DayOfWeek_StartTime",
                table: "DoctorSchedules",
                columns: new[] { "DoctorId", "DayOfWeek", "StartTime" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_TokenHash",
                table: "RefreshTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "DoctorSchedules");
            migrationBuilder.DropTable(name: "RefreshTokens");
        }
    }
}

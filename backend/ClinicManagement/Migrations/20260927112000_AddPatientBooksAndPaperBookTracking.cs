using System;
using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260927112000_AddPatientBooksAndPaperBookTracking")]
    public partial class AddPatientBooksAndPaperBookTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PatientBooks",
                columns: table => new
                {
                    PatientBookId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientId = table.Column<int>(type: "int", nullable: true),
                    BookNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PreviousBookId = table.Column<int>(type: "int", nullable: true),
                    IssuedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientBooks", x => x.PatientBookId);
                    table.ForeignKey(
                        name: "FK_PatientBooks_PatientBooks_PreviousBookId",
                        column: x => x.PreviousBookId,
                        principalTable: "PatientBooks",
                        principalColumn: "PatientBookId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PatientBooks_Users_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.AddColumn<int>(
                name: "PatientBookId",
                table: "Appointments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BookVerifiedAt",
                table: "Appointments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PatientBookId",
                table: "MedicalRecords",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaperBookUpdatedAt",
                table: "MedicalRecords",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_PatientBookId",
                table: "Appointments",
                column: "PatientBookId");

            migrationBuilder.CreateIndex(
                name: "IX_MedicalRecords_PatientBookId",
                table: "MedicalRecords",
                column: "PatientBookId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientBooks_BookNumber",
                table: "PatientBooks",
                column: "BookNumber",
                unique: true,
                filter: "[BookNumber] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PatientBooks_PatientId",
                table: "PatientBooks",
                column: "PatientId",
                unique: true,
                filter: "[PatientId] IS NOT NULL AND [Status] = 'Issued'");

            migrationBuilder.CreateIndex(
                name: "IX_PatientBooks_PreviousBookId",
                table: "PatientBooks",
                column: "PreviousBookId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_PatientBooks_PatientBookId",
                table: "Appointments",
                column: "PatientBookId",
                principalTable: "PatientBooks",
                principalColumn: "PatientBookId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MedicalRecords_PatientBooks_PatientBookId",
                table: "MedicalRecords",
                column: "PatientBookId",
                principalTable: "PatientBooks",
                principalColumn: "PatientBookId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_PatientBooks_PatientBookId",
                table: "Appointments");

            migrationBuilder.DropForeignKey(
                name: "FK_MedicalRecords_PatientBooks_PatientBookId",
                table: "MedicalRecords");

            migrationBuilder.DropTable(
                name: "PatientBooks");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_PatientBookId",
                table: "Appointments");

            migrationBuilder.DropIndex(
                name: "IX_MedicalRecords_PatientBookId",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "BookVerifiedAt",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "PatientBookId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "PaperBookUpdatedAt",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "PatientBookId",
                table: "MedicalRecords");
        }
    }
}

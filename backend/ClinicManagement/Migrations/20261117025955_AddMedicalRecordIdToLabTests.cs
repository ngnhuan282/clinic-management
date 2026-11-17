using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddMedicalRecordIdToLabTests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MedicalRecordId",
                table: "LabTests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PatientProfileId",
                table: "LabTests",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LabTests_MedicalRecordId",
                table: "LabTests",
                column: "MedicalRecordId");

            migrationBuilder.AddForeignKey(
                name: "FK_LabTests_MedicalRecords_MedicalRecordId",
                table: "LabTests",
                column: "MedicalRecordId",
                principalTable: "MedicalRecords",
                principalColumn: "MedicalRecordId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LabTests_MedicalRecords_MedicalRecordId",
                table: "LabTests");

            migrationBuilder.DropIndex(
                name: "IX_LabTests_MedicalRecordId",
                table: "LabTests");

            migrationBuilder.DropColumn(
                name: "MedicalRecordId",
                table: "LabTests");

            migrationBuilder.DropColumn(
                name: "PatientProfileId",
                table: "LabTests");
        }
    }
}

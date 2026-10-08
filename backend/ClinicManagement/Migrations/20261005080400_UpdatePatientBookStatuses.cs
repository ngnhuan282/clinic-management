using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePatientBookStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_PatientBooks_Status",
                table: "PatientBooks");

            migrationBuilder.AddCheckConstraint(
                name: "CK_PatientBooks_Status",
                table: "PatientBooks",
                sql: "[Status] IN ('Pending','Issued','Lost','Replaced')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_PatientBooks_Status",
                table: "PatientBooks");

            migrationBuilder.AddCheckConstraint(
                name: "CK_PatientBooks_Status",
                table: "PatientBooks",
                sql: "[Status] IN ('Issued','Voided')");
        }
    }
}

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

            migrationBuilder.Sql("UPDATE PatientBooks SET Status = 'Replaced' WHERE Status = 'Voided';");

            migrationBuilder.AddCheckConstraint(
                name: "CK_PatientBooks_Status",
                table: "PatientBooks",
                sql: "[Status] IN ('Pending','Issued','Lost','Replaced')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (SELECT 1 FROM PatientBooks WHERE Status = 'Pending')
                    THROW 51000, 'Resolve pending patient books before downgrading to the legacy book statuses.', 1;
                """);

            migrationBuilder.DropCheckConstraint(
                name: "CK_PatientBooks_Status",
                table: "PatientBooks");

            migrationBuilder.Sql("UPDATE PatientBooks SET Status = 'Voided' WHERE Status IN ('Lost', 'Replaced');");

            migrationBuilder.AddCheckConstraint(
                name: "CK_PatientBooks_Status",
                table: "PatientBooks",
                sql: "[Status] IN ('Issued','Voided')");
        }
    }
}

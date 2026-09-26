using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddLabTechnicianRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "RoleId", "Description", "RoleName" },
                values: new object[] { 5, "Lab technician", "LabTechnician" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 5);
        }
    }
}

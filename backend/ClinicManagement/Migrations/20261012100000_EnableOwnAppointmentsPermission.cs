using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261012100000_EnableOwnAppointmentsPermission")]
public class EnableOwnAppointmentsPermission : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(
        "UPDATE [Permissions] SET [IsImplemented] = 1 WHERE [Code] = N'appointments.viewOwn';");

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(
        "UPDATE [Permissions] SET [IsImplemented] = 0 WHERE [Code] = N'appointments.viewOwn';");
}

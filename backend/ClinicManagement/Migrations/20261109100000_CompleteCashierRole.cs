using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ClinicManagement.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261109100000_CompleteCashierRole")]
public sealed class CompleteCashierRole : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        using var stream = typeof(CompleteCashierRole).Assembly.GetManifestResourceStream(
            "ClinicManagement.Data.Seed.20261109-cashier-role.sql")
            ?? throw new InvalidOperationException("Cashier role SQL resource is missing.");
        using var reader = new StreamReader(stream);
        migrationBuilder.Sql(reader.ReadToEnd());
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Preserve accounts and grants that may have existed before this data-only migration.
    }
}

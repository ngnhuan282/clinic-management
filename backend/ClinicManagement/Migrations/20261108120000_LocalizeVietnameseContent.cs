using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ClinicManagement.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261108120000_LocalizeVietnameseContent")]
public sealed class LocalizeVietnameseContent : Migration
{
    public static string RepairSql
    {
        get
        {
            using var stream = typeof(LocalizeVietnameseContent).Assembly.GetManifestResourceStream(
                "ClinicManagement.Data.Seed.20261108-vietnamese-content.sql")
                ?? throw new InvalidOperationException("Missing versioned Vietnamese content repair.");
            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
    }

    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(RepairSql);

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Data-only correction: preserve Vietnamese content when rolling back.
        // No schema, identifiers, account permissions or clinical values are removed.
    }
}

using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261007120000_RestrictDiseaseCatalogManagement")]
public partial class RestrictDiseaseCatalogManagement : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DELETE FROM [RolePermissions]
            WHERE [RoleId] = 2
              AND [PermissionCode] = 'clinical.manageDiseases';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF NOT EXISTS (
                SELECT 1
                FROM [RolePermissions]
                WHERE [RoleId] = 2
                  AND [PermissionCode] = 'clinical.manageDiseases'
            )
            INSERT INTO [RolePermissions] ([PermissionCode], [RoleId])
            VALUES ('clinical.manageDiseases', 2);
            """);
    }
}

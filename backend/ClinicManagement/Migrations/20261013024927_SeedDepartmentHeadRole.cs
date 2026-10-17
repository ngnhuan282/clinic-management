using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class SeedDepartmentHeadRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent: the demo seed script (clinic-all-tables-demo.sql) inserts RoleId 6
            // and its permissions directly via raw SQL, bypassing EF's migration history, so
            // this must not assume a bare table on databases that already ran that script.
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleId = 6)
BEGIN
    SET IDENTITY_INSERT dbo.Roles ON;
    INSERT INTO dbo.Roles (RoleId, RoleName, Description, IsSystem)
    VALUES (6, N'DepartmentHead', N'Department head and doctor', 1);
    SET IDENTITY_INSERT dbo.Roles OFF;
END
");

            migrationBuilder.Sql(@"
INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
SELECT 6, v.PermissionCode
FROM (VALUES
    ('appointments.startExamination'),
    ('clinical.editDiagnosis'),
    ('clinical.manageDiseases'),
    ('clinical.viewAssigned'),
    ('clinical.writeRecord'),
    ('labs.order'),
    ('labs.viewOrders'),
    ('labs.viewTypes'),
    ('pharmacy.prescribe'),
    ('pharmacy.viewCatalog'),
    ('pharmacy.viewInventory'),
    ('schedules.review')
) AS v(PermissionCode)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.RolePermissions rp WHERE rp.RoleId = 6 AND rp.PermissionCode = v.PermissionCode
);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM dbo.RolePermissions WHERE RoleId = 6;");
            migrationBuilder.Sql("DELETE FROM dbo.Roles WHERE RoleId = 6;");
        }
    }
}

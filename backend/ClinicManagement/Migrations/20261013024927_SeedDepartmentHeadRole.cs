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
            // AddScheduleReview already owns this role. Existing databases may use a different ID.
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'DepartmentHead')
BEGIN
    INSERT INTO dbo.Roles (RoleName, Description, IsSystem)
    VALUES (N'DepartmentHead', N'Department head and doctor', 1);
END
UPDATE dbo.Roles SET IsSystem = 1 WHERE RoleName = N'DepartmentHead';
");

            migrationBuilder.Sql(@"
INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
SELECT r.RoleId, v.PermissionCode
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
CROSS JOIN dbo.Roles r
WHERE r.RoleName = N'DepartmentHead'
AND NOT EXISTS (
    SELECT 1 FROM dbo.RolePermissions rp WHERE rp.RoleId = r.RoleId AND rp.PermissionCode = v.PermissionCode
);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Keep the role and permissions owned by AddScheduleReview, including custom role IDs.
        }
    }
}

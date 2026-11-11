using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ClinicManagement.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261109090000_CompleteAdminAccounts")]
public sealed class CompleteAdminAccounts : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(@"
UPDATE Permissions SET IsImplemented = 1 WHERE Code = N'accounts.create';
UPDATE Permissions SET Name = N'Chỉnh sửa, khóa hoặc mở khóa tài khoản' WHERE Code = N'accounts.update';
INSERT INTO RolePermissions (RoleId, PermissionCode)
SELECT r.RoleId, N'accounts.create' FROM Roles r
WHERE r.RoleName = N'Admin'
AND NOT EXISTS (SELECT 1 FROM RolePermissions p WHERE p.RoleId = r.RoleId AND p.PermissionCode = N'accounts.create');
");

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(@"
UPDATE Permissions SET IsImplemented = 0 WHERE Code = N'accounts.create';
UPDATE Permissions SET Name = N'Khóa hoặc mở khóa tài khoản' WHERE Code = N'accounts.update';
");
}

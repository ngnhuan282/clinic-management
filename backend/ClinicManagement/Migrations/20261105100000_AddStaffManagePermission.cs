using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ClinicManagement.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261105100000_AddStaffManagePermission")]
public sealed class AddStaffManagePermission : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM Permissions WHERE Code = N'staff.manage')
    INSERT INTO Permissions (Code, Module, Name, Kind, Scope, IsImplemented)
    VALUES (N'staff.manage', N'Nhân sự', N'Quản lý hồ sơ bác sĩ và nhân viên', N'Sửa', NULL, 1);

INSERT INTO RolePermissions (RoleId, PermissionCode)
SELECT r.RoleId, N'staff.manage' FROM Roles r
WHERE r.RoleName = N'Admin'
AND NOT EXISTS (SELECT 1 FROM RolePermissions p
    WHERE p.RoleId = r.RoleId AND p.PermissionCode = N'staff.manage');
");

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(@"
DELETE FROM RolePermissions WHERE PermissionCode = N'staff.manage';
DELETE FROM Permissions WHERE Code = N'staff.manage';
");
}

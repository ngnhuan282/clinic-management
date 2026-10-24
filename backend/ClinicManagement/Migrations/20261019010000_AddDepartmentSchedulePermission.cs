using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ClinicManagement.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261019010000_AddDepartmentSchedulePermission")]
public sealed class AddDepartmentSchedulePermission : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM Permissions WHERE Code = N'schedules.viewDepartment')
    INSERT INTO Permissions (Code, Module, Name, Kind, Scope, IsImplemented)
    VALUES (N'schedules.viewDepartment', N'Lịch bác sĩ', N'Xem lịch trực khoa', N'Xem', N'Chỉ khoa của Trưởng khoa đăng nhập', 1);

INSERT INTO RolePermissions (RoleId, PermissionCode)
SELECT r.RoleId, N'schedules.viewDepartment' FROM Roles r
WHERE r.RoleName = N'DepartmentHead'
AND NOT EXISTS (SELECT 1 FROM RolePermissions p
    WHERE p.RoleId = r.RoleId AND p.PermissionCode = N'schedules.viewDepartment');
");

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(@"
DELETE FROM RolePermissions WHERE PermissionCode = N'schedules.viewDepartment';
DELETE FROM Permissions WHERE Code = N'schedules.viewDepartment';
");
}

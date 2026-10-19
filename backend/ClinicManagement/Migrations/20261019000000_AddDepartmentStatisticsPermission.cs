using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ClinicManagement.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261019000000_AddDepartmentStatisticsPermission")]
public sealed class AddDepartmentStatisticsPermission : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM Permissions WHERE Code = N'reports.departmentStatistics')
    INSERT INTO Permissions (Code, Module, Name, Kind, Scope, IsImplemented)
    VALUES (N'reports.departmentStatistics', N'Báo cáo', N'Thống kê khoa', N'Xem', N'Chỉ khoa của Trưởng khoa đăng nhập', 1);

INSERT INTO RolePermissions (RoleId, PermissionCode)
SELECT r.RoleId, N'reports.departmentStatistics' FROM Roles r
WHERE r.RoleName = N'DepartmentHead'
AND NOT EXISTS (SELECT 1 FROM RolePermissions p
    WHERE p.RoleId = r.RoleId AND p.PermissionCode = N'reports.departmentStatistics');
");

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(@"
DELETE FROM RolePermissions WHERE PermissionCode = N'reports.departmentStatistics';
DELETE FROM Permissions WHERE Code = N'reports.departmentStatistics';
");
}

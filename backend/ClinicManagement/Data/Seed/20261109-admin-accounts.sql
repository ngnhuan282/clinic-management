-- Applies only the permission data from CompleteAdminAccounts.
-- Safe to re-run; does not mark unrelated migrations as applied.
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM Permissions WHERE Code = N'accounts.create')
    OR NOT EXISTS (SELECT 1 FROM Permissions WHERE Code = N'accounts.update')
    OR NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = N'Admin')
    THROW 51000, 'Existing RBAC permissions and Admin role are required.', 1;

UPDATE Permissions SET IsImplemented = 1 WHERE Code = N'accounts.create';
UPDATE Permissions SET Name = N'Chỉnh sửa, khóa hoặc mở khóa tài khoản'
WHERE Code = N'accounts.update';

INSERT INTO RolePermissions (RoleId, PermissionCode)
SELECT r.RoleId, N'accounts.create' FROM Roles r
WHERE r.RoleName = N'Admin'
AND NOT EXISTS (
    SELECT 1 FROM RolePermissions p
    WHERE p.RoleId = r.RoleId AND p.PermissionCode = N'accounts.create'
);
COMMIT TRANSACTION;

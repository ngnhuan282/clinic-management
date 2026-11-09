SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
BEGIN TRANSACTION;

IF (SELECT COUNT(*) FROM dbo.Permissions
    WHERE Code IN (N'billing.view', N'billing.create', N'billing.recordPayment')) <> 3
    THROW 51000, 'Billing permissions must exist before provisioning Cashier.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Cashier')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleId = 8)
    BEGIN
        SET IDENTITY_INSERT dbo.Roles ON;
        INSERT INTO dbo.Roles (RoleId, RoleName, Description, IsSystem)
        VALUES (8, N'Cashier', N'Cashier', 1);
        SET IDENTITY_INSERT dbo.Roles OFF;
    END
    ELSE
        INSERT INTO dbo.Roles (RoleName, Description, IsSystem)
        VALUES (N'Cashier', N'Cashier', 1);
END;

-- Preserve existing IDs, accounts and additional grants when Cashier was created manually.
UPDATE dbo.Roles SET IsSystem = 1 WHERE RoleName = N'Cashier';
INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
SELECT r.RoleId, p.Code FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.RoleName = N'Cashier'
AND p.Code IN (N'billing.view', N'billing.create', N'billing.recordPayment')
AND NOT EXISTS (SELECT 1 FROM dbo.RolePermissions existing
    WHERE existing.RoleId = r.RoleId AND existing.PermissionCode = p.Code);

COMMIT TRANSACTION;

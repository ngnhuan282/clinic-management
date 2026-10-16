-- Non-destructive repair for accounts from clinic-all-tables-demo.sql.
-- Only known demo account IDs and seed-generated profiles are linked.
-- Books, appointments, medical records and user-entered clinical data stay unchanged.
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

DECLARE @identityInsert bit = 0;
BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @demoAccounts TABLE (UserId int PRIMARY KEY);
    INSERT INTO @demoAccounts (UserId)
    SELECT u.UserId
    FROM dbo.Users u
    JOIN dbo.Roles r ON r.RoleId = u.RoleId
    WHERE r.RoleName = 'Patient'
      AND (u.UserId = 1004 OR u.UserId BETWEEN 1006 AND 1020)
      AND u.Username = CONCAT('demo_patient', RIGHT(CONCAT('0', u.UserId - 1000), 2));

    UPDATE p SET UserId = a.UserId
    FROM dbo.Patients p
    JOIN @demoAccounts a ON a.UserId = p.PatientId
    WHERE p.UserId IS NULL
      AND p.IdentityNumber = CONCAT('0792', RIGHT(CONCAT('00000000', a.UserId), 8))
      AND NOT EXISTS (SELECT 1 FROM dbo.Patients linked WHERE linked.UserId = a.UserId);

    -- Never attach an unrelated profile just because its primary key happens to match.
    IF EXISTS (
        SELECT 1 FROM @demoAccounts a
        JOIN dbo.Patients p ON p.PatientId = a.UserId
        WHERE NOT EXISTS (SELECT 1 FROM dbo.Patients linked WHERE linked.UserId = a.UserId)
    )
        THROW 51004, 'A demo patient ID is already occupied by an unrecognized profile. Review its account link manually.', 1;

    DECLARE @today date = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time' AS date);
    SET IDENTITY_INSERT dbo.Patients ON;
    SET @identityInsert = 1;
    INSERT INTO dbo.Patients
        (PatientId, FullName, Phone, BirthDate, IdentityNumber, InsuranceCode, CreatedAt, UserId)
    SELECT u.UserId, u.FullName, u.Phone,
           DATEADD(year, -(25 + u.UserId % 15), @today),
           CONCAT('0792', RIGHT(CONCAT('00000000', u.UserId), 8)),
           CONCAT('DN', RIGHT(CONCAT('00000000', u.UserId), 8)),
           SYSUTCDATETIME(), u.UserId
    FROM @demoAccounts a
    JOIN dbo.Users u ON u.UserId = a.UserId
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Patients p WHERE p.UserId = a.UserId);
    SET IDENTITY_INSERT dbo.Patients OFF;
    SET @identityInsert = 0;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF @identityInsert = 1 SET IDENTITY_INSERT dbo.Patients OFF;
    THROW;
END CATCH;

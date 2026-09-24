-- SQL Server / LocalDB demo data. Apply EF migrations before running this file.
-- Reserved demo IDs: 1001-1020. Re-running is safe for the rows created here.
-- Admin login: admin / admin123 (BCrypt work factor 12).
-- This file is for local development only. Do not run on a production database.
SET NOCOUNT ON;
SET XACT_ABORT ON;
-- Required by SQL Server when inserting/updating tables with filtered indexes via sqlcmd.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH('dbo.Users', 'SecurityVersion') IS NULL
       OR COL_LENGTH('dbo.RefreshTokens', 'SecurityVersion') IS NULL
        THROW 51000, 'Apply all EF migrations before running clinic-all-tables-demo.sql.', 1;

    DECLARE @n TABLE (n int PRIMARY KEY);
    INSERT INTO @n (n) VALUES
        (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),
        (11),(12),(13),(14),(15),(16),(17),(18),(19),(20);
    DECLARE @hash varchar(256) = '$2a$12$g1Jw42F6MdO6h0JPZruVW.xnaXwI25sZNQSsftAPx6zrXGeoVkaTC';
    DECLARE @now datetime2 = SYSUTCDATETIME();

    -- EF migrations already create the four functional roles.
    SET IDENTITY_INSERT dbo.Roles ON;
    INSERT INTO dbo.Roles (RoleId, RoleName, Description)
    SELECT 1000+n, CONCAT('DemoRole', RIGHT(CONCAT('0', n), 2)),
           'Reserved demo role; not assignable through the API'
    FROM @n AS numbers
    WHERE n BETWEEN 5 AND 20
      AND NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.Roles OFF;

    SET IDENTITY_INSERT dbo.Departments ON;
    INSERT INTO dbo.Departments (DepartmentId, Code, Name, Description, IsActive, CreatedAt, UpdatedAt)
    SELECT 1000+n, CONCAT('DEMO-D', RIGHT(CONCAT('0', n), 2)),
           CONCAT('Demo department ', n), 'Seed data for local development', 1, @now, @now
    FROM @n AS numbers
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Departments WHERE DepartmentId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.Departments OFF;

    SET IDENTITY_INSERT dbo.Specializations ON;
    INSERT INTO dbo.Specializations (SpecializationId, Code, Name, Description, DepartmentId, IsActive, CreatedAt, UpdatedAt)
    SELECT 1000+n, CONCAT('DEMO-S', RIGHT(CONCAT('0', n), 2)),
           CONCAT('Demo specialization ', n), 'Seed data for local development',
           1000+n, 1, @now, @now
    FROM @n AS numbers
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Specializations WHERE SpecializationId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.Specializations OFF;

    SET IDENTITY_INSERT dbo.Rooms ON;
    INSERT INTO dbo.Rooms (RoomId, RoomNumber, Name, RoomType, DepartmentId, Location, IsActive, CreatedAt, UpdatedAt)
    SELECT 1000+n, CONCAT('DEMO-R', RIGHT(CONCAT('0', n), 2)),
           CONCAT('Demo room ', n), 'Consultation', 1000+n, 'Demo floor', 1, @now, @now
    FROM @n AS numbers
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Rooms WHERE RoomId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.Rooms OFF;

    SET IDENTITY_INSERT dbo.Doctors ON;
    INSERT INTO dbo.Doctors (DoctorId, FullName, Title, ExperienceYears, Biography, IsActive, DepartmentId)
    SELECT 1000+n, CONCAT('Demo doctor ', n), 'Doctor', 3+n,
           'Seed data for local development', 1, 1000+n
    FROM @n AS numbers
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Doctors WHERE DoctorId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.Doctors OFF;

    SET IDENTITY_INSERT dbo.DoctorSchedules ON;
    INSERT INTO dbo.DoctorSchedules (DoctorScheduleId, DoctorId, DayOfWeek, StartTime, EndTime, IsActive)
    SELECT 1000+n, 1000+n, 1, CAST('08:00:00' AS time), CAST('12:00:00' AS time), 1
    FROM @n AS numbers
    WHERE NOT EXISTS (SELECT 1 FROM dbo.DoctorSchedules WHERE DoctorScheduleId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.DoctorSchedules OFF;

    -- If an admin user already exists, make the documented local demo credentials work.
    -- Re-running with the same hash leaves the account and its sessions unchanged.
    IF EXISTS (SELECT 1 FROM dbo.Users WHERE Username = 'admin')
    BEGIN
        UPDATE dbo.Users
        SET PasswordHash = @hash, RoleId = 1, Status = 1,
            SecurityVersion = SecurityVersion + 1
        WHERE Username = 'admin'
          AND (PasswordHash <> @hash OR RoleId <> 1 OR Status <> 1);
        IF @@ROWCOUNT > 0
            UPDATE dbo.RefreshTokens
            SET RevokedAt = @now
            WHERE UserId = (SELECT UserId FROM dbo.Users WHERE Username = 'admin')
              AND RevokedAt IS NULL;
    END
    ELSE
    BEGIN
        SET IDENTITY_INSERT dbo.Users ON;
        INSERT INTO dbo.Users (UserId, Username, PasswordHash, FullName, Email, Phone, RoleId, Status, SecurityVersion, CreatedAt)
        VALUES (1001, 'admin', @hash, 'Demo Administrator', 'demo-admin@example.test',
                '0900000001', 1, 1, 0, @now);
        SET IDENTITY_INSERT dbo.Users OFF;
    END;
    DECLARE @adminId int = (SELECT UserId FROM dbo.Users WHERE Username = 'admin');

    SET IDENTITY_INSERT dbo.Users ON;
    INSERT INTO dbo.Users (UserId, Username, PasswordHash, FullName, Email, Phone, RoleId, Status, SecurityVersion, CreatedAt)
    SELECT 1000+n,
           CASE n WHEN 2 THEN 'demo_doctor' WHEN 3 THEN 'demo_reception'
               ELSE CONCAT('demo_patient', RIGHT(CONCAT('0', n), 2)) END,
           @hash,
           CASE n WHEN 2 THEN 'Demo Doctor' WHEN 3 THEN 'Demo Receptionist'
               ELSE CONCAT('Demo Patient ', n) END,
           CONCAT('demo-user', RIGHT(CONCAT('0', n), 2), '@example.test'),
           CONCAT('090000', RIGHT(CONCAT('0000', n), 4)),
           CASE n WHEN 2 THEN 2 WHEN 3 THEN 3 ELSE 4 END,
           1, 0, @now
    FROM @n AS numbers
    WHERE n BETWEEN 2 AND 20
      AND NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.Users OFF;

    SET IDENTITY_INSERT dbo.Appointments ON;
    INSERT INTO dbo.Appointments
        (AppointmentId, DoctorId, PatientId, PatientName, PatientPhone,
         AppointmentDate, StartTime, EndTime, Reason, Status, CreatedAt)
    SELECT 1000+n, 1000+n, 1004+(n-1)%17,
           CONCAT('Demo Patient ', 4+(n-1)%17),
           CONCAT('090000', RIGHT(CONCAT('0000', 4+(n-1)%17), 4)),
           DATEADD(day, 30+n, CAST(@now AS date)),
           CAST('08:00:00' AS time), CAST('08:30:00' AS time),
           'Demo appointment', 'Pending', @now
    FROM @n AS numbers
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Appointments WHERE AppointmentId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.Appointments OFF;

    SET IDENTITY_INSERT dbo.MedicineCategories ON;
    INSERT INTO dbo.MedicineCategories (CategoryId, CategoryName)
    SELECT 1000+n, CONCAT('Demo category ', n)
    FROM @n AS numbers
    WHERE NOT EXISTS (SELECT 1 FROM dbo.MedicineCategories WHERE CategoryId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.MedicineCategories OFF;

    SET IDENTITY_INSERT dbo.Suppliers ON;
    INSERT INTO dbo.Suppliers (SupplierId, SupplierName, ContactInfo, Address)
    SELECT 1000+n, CONCAT('Demo supplier ', n),
           CONCAT('090000', RIGHT(CONCAT('0000', n), 4)), 'Demo address'
    FROM @n AS numbers
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Suppliers WHERE SupplierId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.Suppliers OFF;

    SET IDENTITY_INSERT dbo.Medicines ON;
    INSERT INTO dbo.Medicines (MedicineId, MedicineName, CategoryId, SupplierId, Unit, UnitPrice, Description)
    SELECT 1000+n, CONCAT('Demo medicine ', n), 1000+n, 1000+n,
           'tablet', CAST(5000+100*n AS decimal(18,2)), 'Seed data for local development'
    FROM @n AS numbers
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Medicines WHERE MedicineId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.Medicines OFF;

    SET IDENTITY_INSERT dbo.Inventory ON;
    INSERT INTO dbo.Inventory (InventoryId, MedicineId, BatchNumber, QuantityInStock, ExpiryDate)
    SELECT 1000+n, 1000+n, CONCAT('DEMO-BATCH-', RIGHT(CONCAT('0', n), 2)),
           20+n, DATEADD(day, 365+n, CAST(@now AS date))
    FROM @n AS numbers
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Inventory WHERE InventoryId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.Inventory OFF;

    SET IDENTITY_INSERT dbo.LabTestTypes ON;
    INSERT INTO dbo.LabTestTypes (Id, Name, Description, Price, IsActive, CreatedAt, UpdatedAt)
    SELECT 1000+n, CONCAT('Demo lab test ', n), 'Seed data for local development',
           CAST(50000+1000*n AS decimal(18,2)), 1, @now, NULL
    FROM @n AS numbers
    WHERE NOT EXISTS (SELECT 1 FROM dbo.LabTestTypes WHERE Id = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.LabTestTypes OFF;

    -- These are already revoked: no usable refresh token is published by the seed.
    SET IDENTITY_INSERT dbo.RefreshTokens ON;
    INSERT INTO dbo.RefreshTokens (RefreshTokenId, UserId, SecurityVersion, TokenHash, ExpiresAt, RevokedAt)
    SELECT 1000+n, CASE WHEN n = 1 THEN @adminId ELSE 1000+n END,
           0, CONVERT(char(64), HASHBYTES('SHA2_256', CONCAT('clinic-demo-revoked-', n)), 2),
           DATEADD(day, -1, @now), @now
    FROM @n AS numbers
    WHERE NOT EXISTS (SELECT 1 FROM dbo.RefreshTokens WHERE RefreshTokenId = 1000+numbers.n);
    SET IDENTITY_INSERT dbo.RefreshTokens OFF;

    COMMIT TRANSACTION;

    SELECT 'Roles' AS TableName, COUNT(*) AS TotalRows FROM dbo.Roles
    UNION ALL SELECT 'Users', COUNT(*) FROM dbo.Users
    UNION ALL SELECT 'RefreshTokens', COUNT(*) FROM dbo.RefreshTokens
    UNION ALL SELECT 'Departments', COUNT(*) FROM dbo.Departments
    UNION ALL SELECT 'Specializations', COUNT(*) FROM dbo.Specializations
    UNION ALL SELECT 'Rooms', COUNT(*) FROM dbo.Rooms
    UNION ALL SELECT 'Doctors', COUNT(*) FROM dbo.Doctors
    UNION ALL SELECT 'DoctorSchedules', COUNT(*) FROM dbo.DoctorSchedules
    UNION ALL SELECT 'Appointments', COUNT(*) FROM dbo.Appointments
    UNION ALL SELECT 'MedicineCategories', COUNT(*) FROM dbo.MedicineCategories
    UNION ALL SELECT 'Suppliers', COUNT(*) FROM dbo.Suppliers
    UNION ALL SELECT 'Medicines', COUNT(*) FROM dbo.Medicines
    UNION ALL SELECT 'Inventory', COUNT(*) FROM dbo.Inventory
    UNION ALL SELECT 'LabTestTypes', COUNT(*) FROM dbo.LabTestTypes;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

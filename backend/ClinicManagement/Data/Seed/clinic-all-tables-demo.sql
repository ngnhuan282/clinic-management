-- SQL Server / LocalDB reset seed for local development.
-- Apply every EF migration first. This transaction DELETES ALL application data.
-- It preserves __EFMigrationsHistory so the schema remains usable.
-- Demo credentials: admin / admin123. All demo accounts use the same password.
-- Never run this file against a database containing data you need to keep.
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
       OR COL_LENGTH('dbo.Doctors', 'SpecializationId') IS NULL
       OR OBJECT_ID('dbo.LabTestResults', 'U') IS NULL
       OR OBJECT_ID('dbo.RecordDiagnoses', 'U') IS NULL
       OR OBJECT_ID('dbo.RolePermissions', 'U') IS NULL
       OR COL_LENGTH('dbo.Doctors', 'UserId') IS NULL
       OR OBJECT_ID('dbo.DoctorScheduleRequests', 'U') IS NULL
       OR NOT EXISTS (SELECT 1 FROM dbo.__EFMigrationsHistory WHERE MigrationId = '20260926172919_AddLabTechnicianRole')
        THROW 51000, 'Apply all EF migrations before running clinic-all-tables-demo.sql.', 1;

    -- Reused demo user IDs must not accept access tokens issued before this reset.
    DECLARE @securityVersion int = COALESCE((SELECT MAX(SecurityVersion) FROM dbo.Users), 0);
    SET @securityVersion = CASE WHEN @securityVersion >= 2147483647 THEN 1 ELSE @securityVersion + 1 END;

    -- Delete children before parents. Constraints and migration metadata stay intact.
    DELETE FROM dbo.RbacAudits;
    DELETE FROM dbo.LabTestResults;
    DELETE FROM dbo.LabTests;
    DELETE FROM dbo.RecordDiagnoses;
    DELETE FROM dbo.MedicalRecords;
    DELETE FROM dbo.Appointments;
    DELETE FROM dbo.TimeSlots;
    DELETE FROM dbo.DoctorSchedules;
    DELETE FROM dbo.DoctorScheduleRequests;
    DELETE FROM dbo.Inventory;
    DELETE FROM dbo.Medicines;
    DELETE FROM dbo.LabTestTypes;
    DELETE FROM dbo.Diseases;
    DELETE FROM dbo.Doctors;
    DELETE FROM dbo.RefreshTokens;
    DELETE FROM dbo.Users;
    DELETE FROM dbo.MedicineCategories;
    DELETE FROM dbo.Suppliers;
    DELETE FROM dbo.Rooms;
    DELETE FROM dbo.Specializations;
    DELETE FROM dbo.Departments;
    DELETE FROM dbo.RolePermissions;
    DELETE FROM dbo.Roles;

    DECLARE @n TABLE (n int PRIMARY KEY);
    INSERT INTO @n (n) VALUES
        (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),
        (11),(12),(13),(14),(15),(16),(17),(18),(19),(20);
    DECLARE @hash varchar(256) = '$2a$12$g1Jw42F6MdO6h0JPZruVW.xnaXwI25sZNQSsftAPx6zrXGeoVkaTC';
    DECLARE @now datetime2 = SYSUTCDATETIME();
    DECLARE @today date = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time' AS date);

    SET IDENTITY_INSERT dbo.Roles ON;
    INSERT INTO dbo.Roles (RoleId, RoleName, Description, IsSystem) VALUES
        (1, 'Admin', 'System administrator', 1),
        (2, 'Doctor', 'Doctor', 1),
        (3, 'Receptionist', 'Receptionist', 1),
        (4, 'Patient', 'Patient', 1),
        (5, 'LabTechnician', 'Lab technician', 1),
        (6, 'DepartmentHead', 'Department head and doctor', 1);
    INSERT INTO dbo.Roles (RoleId, RoleName, Description)
    SELECT 1000+n, CONCAT('DemoRole', RIGHT(CONCAT('0', n), 2)),
           'Reserved demo role; not assignable through the API'
    FROM @n WHERE n BETWEEN 7 AND 20;
    SET IDENTITY_INSERT dbo.Roles OFF;

    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 1, Code FROM dbo.Permissions WHERE Code NOT IN
        ('appointments.viewOwn','appointments.bookSelf','appointments.cancelOwn','clinical.viewOwn',
         'pharmacy.viewOwnPrescription','labs.viewOwnResult','billing.viewOwn',
         'labs.order','labs.enterResult','labs.viewPending');
    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 2, Code FROM dbo.Permissions WHERE Code IN
        ('appointments.startExamination','clinical.viewAssigned','clinical.writeRecord','clinical.editDiagnosis',
         'clinical.manageDiseases','pharmacy.viewInventory','pharmacy.viewCatalog','pharmacy.prescribe',
         'labs.viewTypes','labs.viewOrders','labs.order');
    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 3, Code FROM dbo.Permissions WHERE Code IN
        ('appointments.view','appointments.createWalkIn','appointments.confirm','appointments.reschedule',
         'appointments.checkIn','pharmacy.dispense','billing.view','billing.create','billing.recordPayment');
    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 4, Code FROM dbo.Permissions WHERE Code IN
        ('appointments.viewOwn','appointments.bookSelf','appointments.cancelOwn','clinical.viewOwn',
         'pharmacy.viewOwnPrescription','labs.viewOrders','labs.viewOwnResult','billing.viewOwn');
    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 5, Code FROM dbo.Permissions WHERE Code IN
        ('labs.viewOrders','labs.viewPending','labs.start','labs.enterResult');
    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 6, Code FROM dbo.Permissions WHERE Code IN
        ('schedules.review','appointments.startExamination','clinical.viewAssigned','clinical.writeRecord',
         'clinical.editDiagnosis','clinical.manageDiseases','pharmacy.viewInventory','pharmacy.viewCatalog',
         'pharmacy.prescribe','labs.viewTypes','labs.viewOrders','labs.order');

    DECLARE @departmentNames TABLE (n int PRIMARY KEY, Code varchar(30), Name nvarchar(150));
    INSERT INTO @departmentNames VALUES
        (1,'NOI',N'Noi tong quat'),(2,'NHI',N'Nhi khoa'),(3,'RHM',N'Rang ham mat'),
        (4,'TIM',N'Tim mach'),(5,'HOHAP',N'Ho hap'),(6,'TIEUHOA',N'Tieu hoa'),
        (7,'NOITIET',N'Noi tiet'),(8,'DALIEU',N'Da lieu'),(9,'MAT',N'Mat'),
        (10,'TMH',N'Tai mui hong'),(11,'CXYK',N'Co xuong khop'),(12,'THANKINH',N'Than kinh'),
        (13,'SAN',N'San phu khoa'),(14,'NIEU',N'Tiet nieu'),(15,'DINHDUONG',N'Dinh duong'),
        (16,'YHCT',N'Y hoc co truyen'),(17,'PHCN',N'Phuc hoi chuc nang'),
        (18,'CAPCUU',N'Cap cuu'),(19,'XETNGHIEM',N'Xet nghiem'),(20,'CDHA',N'Chan doan hinh anh');
    SET IDENTITY_INSERT dbo.Departments ON;
    INSERT INTO dbo.Departments (DepartmentId, Code, Name, Description, IsActive, CreatedAt, UpdatedAt)
    SELECT 1000+n, Code, Name, N'Khoa mau cho phong kham', 1, @now, @now FROM @departmentNames;
    SET IDENTITY_INSERT dbo.Departments OFF;

    SET IDENTITY_INSERT dbo.Specializations ON;
    INSERT INTO dbo.Specializations (SpecializationId, Code, Name, Description, DepartmentId, IsActive, CreatedAt, UpdatedAt)
    SELECT 1000+n, CONCAT('CK-', Code), CONCAT(N'Chuyen khoa ', Name), N'Chuyen khoa mau',
           1000+n, 1, @now, @now FROM @departmentNames;
    SET IDENTITY_INSERT dbo.Specializations OFF;

    SET IDENTITY_INSERT dbo.Rooms ON;
    INSERT INTO dbo.Rooms (RoomId, RoomNumber, Name, RoomType, DepartmentId, Location, IsActive, CreatedAt, UpdatedAt)
    SELECT 1000+n, CONCAT('P', 100+n), CONCAT(N'Phong kham ', Name),
           N'Kham benh', 1000+n, CONCAT(N'Tang ', 1+(n-1)/5), 1, @now, @now
    FROM @departmentNames;
    SET IDENTITY_INSERT dbo.Rooms OFF;

    SET IDENTITY_INSERT dbo.Doctors ON;
    INSERT INTO dbo.Doctors (DoctorId, FullName, Title, ExperienceYears, Biography, IsActive, DepartmentId, SpecializationId)
    SELECT 1000+n, CONCAT(N'Bac si mau ', RIGHT(CONCAT('0', n), 2)),
           CASE WHEN n%3=0 THEN 'ThS.BS' ELSE 'BS.CKI' END, 4+n%16,
           CONCAT(N'Kham va dieu tri ', Name), 1, 1000+n, 1000+n
    FROM @departmentNames;
    SET IDENTITY_INSERT dbo.Doctors OFF;

    SET IDENTITY_INSERT dbo.DoctorScheduleRequests ON;
    INSERT INTO dbo.DoctorScheduleRequests
        (RequestId, DoctorId, RoomId, WorkDate, StartTime, EndTime, Status, CreatedAt)
    SELECT 1000+n, 1000+n, 1000+n,
           CASE WHEN n BETWEEN 1 AND 4 OR n BETWEEN 17 AND 20 THEN @today ELSE DATEADD(day, n-4, @today) END,
           CASE WHEN n <= 4 THEN CAST('09:00:00' AS time) ELSE CAST('08:00:00' AS time) END,
           CASE WHEN n <= 4 THEN CAST('09:30:00' AS time) ELSE CAST('08:30:00' AS time) END,
           'Approved', @now FROM @n;
    SET IDENTITY_INSERT dbo.DoctorScheduleRequests OFF;

    INSERT INTO dbo.DoctorSchedules (ScheduleId, DoctorId, RoomId, WorkDate, StartTime, EndTime, RequestId, Shift, MaxPatients, IsActive, CreatedAt)
    SELECT CONVERT(uniqueidentifier, CONCAT('00000000-0000-0000-0000-', RIGHT(CONCAT('000000000000', 1000+n), 12))),
           1000+n, 1000+n,
           CASE WHEN n BETWEEN 1 AND 4 OR n BETWEEN 17 AND 20 THEN @today
                ELSE DATEADD(day, n-4, @today) END,
           CASE WHEN n <= 4 THEN CAST('09:00:00' AS time) ELSE CAST('08:00:00' AS time) END,
           CASE WHEN n <= 4 THEN CAST('09:30:00' AS time) ELSE CAST('08:30:00' AS time) END,
           1000+n, 'Morning', 1, 1, @now FROM @n;

    INSERT INTO dbo.TimeSlots (SlotId, ScheduleId, StartTime, EndTime, MaxCapacity, CurrentBooked, IsAvailable)
    SELECT CONVERT(uniqueidentifier, CONCAT('00000000-0000-0000-0001-', RIGHT(CONCAT('000000000000', 1000+n), 12))),
           CONVERT(uniqueidentifier, CONCAT('00000000-0000-0000-0000-', RIGHT(CONCAT('000000000000', 1000+n), 12))),
           CASE WHEN n <= 4 THEN CAST('09:00:00' AS time) ELSE CAST('08:00:00' AS time) END,
           CASE WHEN n <= 4 THEN CAST('09:30:00' AS time) ELSE CAST('08:30:00' AS time) END,
           1, CASE WHEN n <= 4 OR n >= 17 THEN 1 ELSE 0 END,
           CASE WHEN n <= 4 OR n >= 17 THEN 0 ELSE 1 END
    FROM @n;

    SET IDENTITY_INSERT dbo.Users ON;
    INSERT INTO dbo.Users (UserId, Username, PasswordHash, FullName, Email, Phone, RoleId, Status, SecurityVersion, CreatedAt)
    SELECT 1000+n,
           CASE n WHEN 1 THEN 'admin' WHEN 2 THEN 'demo_doctor'
                  WHEN 3 THEN 'demo_reception' WHEN 5 THEN 'demo_labtech'
                  ELSE CONCAT('demo_patient', RIGHT(CONCAT('0', n), 2)) END,
           @hash,
           CASE n WHEN 1 THEN N'Demo Administrator' WHEN 2 THEN N'Demo Doctor'
                  WHEN 3 THEN N'Demo Receptionist' WHEN 5 THEN N'Demo Lab Technician'
                  ELSE CONCAT(N'Demo Patient ', RIGHT(CONCAT('0', n), 2)) END,
           CONCAT('demo-user', RIGHT(CONCAT('0', n), 2), '@example.test'),
           CONCAT('090000', RIGHT(CONCAT('0000', n), 4)),
           CASE n WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3 WHEN 5 THEN 5 ELSE 4 END,
           1, @securityVersion, @now
    FROM @n;
    SET IDENTITY_INSERT dbo.Users OFF;

    UPDATE dbo.Doctors SET UserId = 1002 WHERE DoctorId = 1005;

    DECLARE @appointments TABLE (n int PRIMARY KEY);
    INSERT INTO @appointments SELECT n FROM @n;
    INSERT INTO @appointments VALUES (21),(22),(23),(24);
    SET IDENTITY_INSERT dbo.Appointments ON;
    INSERT INTO dbo.Appointments
        (AppointmentId, DoctorId, PatientId, PatientName, PatientPhone,
         AppointmentDate, StartTime, EndTime, Reason, Status, CreatedAt)
    SELECT 1000+a.n, CASE WHEN a.n <= 20 THEN 1000+a.n ELSE 980+a.n END,
           p.UserId, p.FullName, p.Phone,
           CASE WHEN a.n <= 16 THEN DATEADD(day, -1-(a.n-1)%5, @today) ELSE @today END,
           CASE WHEN a.n > 20 THEN CAST('09:00:00' AS time) ELSE CAST('08:00:00' AS time) END,
           CASE WHEN a.n > 20 THEN CAST('09:30:00' AS time) ELSE CAST('08:30:00' AS time) END,
           N'Kham va tu van suc khoe',
           CASE WHEN a.n <= 16 THEN 'Completed' WHEN a.n <= 20 THEN 'InProgress'
                WHEN a.n%2=1 THEN 'Pending' ELSE 'Confirmed' END,
           DATEADD(day, -7, @now)
    FROM @appointments AS a
    JOIN dbo.Users AS p ON p.UserId = CASE WHEN (a.n-1)%16=0 THEN 1004 ELSE 1005+(a.n-1)%16 END;
    SET IDENTITY_INSERT dbo.Appointments OFF;

    DECLARE @medicineNames TABLE (n int PRIMARY KEY, Name nvarchar(150), Unit nvarchar(20));
    INSERT INTO @medicineNames VALUES
        (1,N'Paracetamol 500mg',N'Vien'),(2,N'Amoxicillin 500mg',N'Vien'),
        (3,N'Amlodipine 5mg',N'Vien'),(4,N'Metformin 500mg',N'Vien'),
        (5,N'Omeprazole 20mg',N'Vien'),(6,N'Cetirizine 10mg',N'Vien'),
        (7,N'Ibuprofen 400mg',N'Vien'),(8,N'Azithromycin 250mg',N'Vien'),
        (9,N'Losartan 50mg',N'Vien'),(10,N'Salbutamol 100mcg',N'Binh'),
        (11,N'Vitamin C 500mg',N'Vien'),(12,N'ORS 5.6g',N'Goi'),
        (13,N'Insulin glargine',N'But'),(14,N'Chlorpheniramine 4mg',N'Vien'),
        (15,N'Diclofenac 50mg',N'Vien'),(16,N'Atorvastatin 20mg',N'Vien'),
        (17,N'Cefuroxime 500mg',N'Vien'),(18,N'Prednisolone 5mg',N'Vien'),
        (19,N'Folic acid 5mg',N'Vien'),(20,N'B-complex',N'Vien');
    DECLARE @categoryNames TABLE (n int PRIMARY KEY, Name nvarchar(100));
    INSERT INTO @categoryNames VALUES
        (1,N'Giam dau ha sot'),(2,N'Khang sinh Penicillin'),(3,N'Tim mach'),
        (4,N'Dieu tri dai thao duong'),(5,N'Da day'),(6,N'Di ung'),
        (7,N'Khang viem khong steroid'),(8,N'Khang sinh Macrolide'),
        (9,N'Dieu tri tang huyet ap'),(10,N'Ho hap'),(11,N'Vitamin C'),
        (12,N'Bu nuoc dien giai'),(13,N'Insulin'),(14,N'Khang histamine'),
        (15,N'Co xuong khop'),(16,N'Ha lipid mau'),(17,N'Khang sinh Cephalosporin'),
        (18,N'Corticosteroid'),(19,N'Acid folic'),(20,N'Vitamin tong hop');
    SET IDENTITY_INSERT dbo.MedicineCategories ON;
    INSERT INTO dbo.MedicineCategories (CategoryId, CategoryName)
    SELECT 1000+n, Name FROM @categoryNames;
    SET IDENTITY_INSERT dbo.MedicineCategories OFF;

    SET IDENTITY_INSERT dbo.Suppliers ON;
    INSERT INTO dbo.Suppliers (SupplierId, SupplierName, ContactInfo, Address)
    SELECT 1000+n, CONCAT('Demo supplier ', n),
           CONCAT('090000', RIGHT(CONCAT('0000', n), 4)), 'Demo address'
    FROM @n;
    SET IDENTITY_INSERT dbo.Suppliers OFF;

    SET IDENTITY_INSERT dbo.Medicines ON;
    INSERT INTO dbo.Medicines (MedicineId, MedicineName, CategoryId, SupplierId, Unit, UnitPrice, Description)
    SELECT 1000+n, Name, 1000+n, 1000+n, Unit,
           CAST(5000+n*2500 AS decimal(18,2)), N'Thuoc mau cho moi truong phat trien'
    FROM @medicineNames;
    SET IDENTITY_INSERT dbo.Medicines OFF;

    SET IDENTITY_INSERT dbo.Inventory ON;
    INSERT INTO dbo.Inventory (InventoryId, MedicineId, BatchNumber, QuantityInStock, ExpiryDate)
    SELECT 1000+n, 1000+n, CONCAT('DEMO-BATCH-', RIGHT(CONCAT('0', n), 2)),
           CASE WHEN n=1 THEN 0 WHEN n IN (2,3) THEN 4 ELSE 30+n*3 END,
           CASE WHEN n IN (4,8) THEN DATEADD(day, 15, @today)
                ELSE DATEADD(day, 365+n, @today) END
    FROM @n;
    SET IDENTITY_INSERT dbo.Inventory OFF;

    DECLARE @labNames TABLE (n int PRIMARY KEY, Name nvarchar(200));
    INSERT INTO @labNames VALUES
        (1,N'Cong thuc mau'),(2,N'Duong huyet'),(3,N'HbA1c'),(4,N'Mo mau'),
        (5,N'Chuc nang gan'),(6,N'Chuc nang than'),(7,N'Tong phan nuoc tieu'),
        (8,N'CRP'),(9,N'Acid uric'),(10,N'Dien giai do'),(11,N'TSH'),
        (12,N'FT4'),(13,N'Ferritin'),(14,N'Vitamin D'),(15,N'HBsAg'),
        (16,N'Anti HCV'),(17,N'Troponin I'),(18,N'PSA'),(19,N'Beta hCG'),
        (20,N'Mau lang');
    SET IDENTITY_INSERT dbo.LabTestTypes ON;
    INSERT INTO dbo.LabTestTypes (Id, Name, Description, Price, IsActive, CreatedAt, UpdatedAt)
    SELECT 1000+n, Name, N'Xet nghiem mau cho phong kham',
           CAST(40000+n*7500 AS decimal(18,2)), 1, @now, NULL FROM @labNames;
    SET IDENTITY_INSERT dbo.LabTestTypes OFF;

    DECLARE @diseases TABLE (n int PRIMARY KEY, Code varchar(30), Name nvarchar(150));
    INSERT INTO @diseases VALUES
        (1,'I10',N'Tang huyet ap'),(2,'E11',N'Dai thao duong type 2'),
        (3,'J06',N'Nhiem khuan ho hap tren'),(4,'J45',N'Hen phe quan'),
        (5,'K29',N'Viem da day'),(6,'M54',N'Dau lung'),
        (7,'E78',N'Roi loan lipid mau'),(8,'J02',N'Viem hong cap'),
        (9,'K21',N'Trao nguoc da day'),(10,'N39',N'Nhiem trung tiet nieu'),
        (11,'L20',N'Viem da co dia'),(12,'H10',N'Viem ket mac'),
        (13,'G43',N'Dau nua dau'),(14,'M17',N'Thoai hoa khop goi'),
        (15,'D50',N'Thieu mau thieu sat'),(16,'B18',N'Viem gan virus man'),
        (17,'R07',N'Dau nguc'),(18,'R51',N'Dau dau'),
        (19,'A09',N'Tieu chay cap'),(20,'I25',N'Benh mach vanh');
    SET IDENTITY_INSERT dbo.Diseases ON;
    INSERT INTO dbo.Diseases (DiseaseId, DiseaseCode, DiseaseName, Description, IsActive, CreatedAt)
    SELECT 1000+n, Code, Name, N'Chan doan mau cho ho so kham', 1, @now FROM @diseases;
    SET IDENTITY_INSERT dbo.Diseases OFF;

    SET IDENTITY_INSERT dbo.MedicalRecords ON;
    INSERT INTO dbo.MedicalRecords
        (MedicalRecordId, AppointmentId, DoctorId, PatientId, ExaminationDate,
         Symptoms, Conclusion, CreatedAt, UpdatedAt)
    SELECT 1000+n, 1000+n, a.DoctorId, a.PatientId, a.AppointmentDate,
           CONCAT(N'Trieu chung can danh gia lan ', n),
           CASE WHEN n <= 16 THEN N'Da kham va huong dan theo doi' ELSE NULL END,
           @now, @now
    FROM @n JOIN dbo.Appointments AS a ON a.AppointmentId = 1000+n;
    SET IDENTITY_INSERT dbo.MedicalRecords OFF;

    SET IDENTITY_INSERT dbo.RecordDiagnoses ON;
    INSERT INTO dbo.RecordDiagnoses (RecordDiagnosisId, MedicalRecordId, DiseaseId, IsPrimary, Note)
    SELECT 1000+n, 1000+n, 1000+n, 1, N'Chan doan chinh' FROM @n;
    SET IDENTITY_INSERT dbo.RecordDiagnoses OFF;

    DECLARE @orders TABLE (n int PRIMARY KEY);
    INSERT INTO @orders SELECT n FROM @n;
    INSERT INTO @orders VALUES (21),(22),(23),(24),(25);
    SET IDENTITY_INSERT dbo.LabTests ON;
    INSERT INTO dbo.LabTests (Id, PatientId, DoctorId, LabTestTypeId, Status, ClinicalDiagnosis, CreatedAt)
    SELECT 1000+o.n,
           CASE WHEN (o.n-1)%16=0 THEN 1004 ELSE 1005+(o.n-1)%16 END,
           1002, 1001+(o.n-1)%20,
           CASE WHEN o.n <= 20 THEN 'Completed' ELSE 'Pending' END,
           N'Kiem tra theo chi dinh bac si', DATEADD(day, -1-(o.n%5), @now)
    FROM @orders AS o;
    SET IDENTITY_INSERT dbo.LabTests OFF;

    SET IDENTITY_INSERT dbo.LabTestResults ON;
    INSERT INTO dbo.LabTestResults (Id, LabTestId, TechnicianId, ResultSummary, Note, FileUrl, PerformedAt)
    SELECT 1000+n, 1000+n, 1005,
           CONCAT(N'Ket qua mau ', RIGHT(CONCAT('0', n), 2), N': trong gioi han tham chieu'),
           N'Da kiem tra', NULL, DATEADD(hour, 2, DATEADD(day, -1-(n%5), @now))
    FROM @n;
    SET IDENTITY_INSERT dbo.LabTestResults OFF;

    -- No usable refresh token is published by this seed.
    SET IDENTITY_INSERT dbo.RefreshTokens ON;
    INSERT INTO dbo.RefreshTokens (RefreshTokenId, UserId, SecurityVersion, TokenHash, ExpiresAt, RevokedAt)
    SELECT 1000+n, 1000+n,
           @securityVersion, CONVERT(char(64), HASHBYTES('SHA2_256', CONCAT('clinic-demo-revoked-', n)), 2),
           DATEADD(day, -1, @now), @now
    FROM @n;
    SET IDENTITY_INSERT dbo.RefreshTokens OFF;

    -- Keep the next generated IDs predictable even if old data used larger IDs.
    DBCC CHECKIDENT ('dbo.Roles', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.DoctorScheduleRequests', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Users', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.RefreshTokens', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Departments', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Specializations', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Rooms', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Doctors', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Appointments', RESEED, 1024) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.MedicineCategories', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Suppliers', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Medicines', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Inventory', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.LabTestTypes', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.LabTests', RESEED, 1025) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.LabTestResults', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Diseases', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.MedicalRecords', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.RecordDiagnoses', RESEED, 1020) WITH NO_INFOMSGS;

    COMMIT TRANSACTION;

    SELECT 'Roles' AS TableName, COUNT(*) AS TotalRows FROM dbo.Roles
    UNION ALL SELECT 'Users', COUNT(*) FROM dbo.Users
    UNION ALL SELECT 'RefreshTokens', COUNT(*) FROM dbo.RefreshTokens
    UNION ALL SELECT 'Departments', COUNT(*) FROM dbo.Departments
    UNION ALL SELECT 'Specializations', COUNT(*) FROM dbo.Specializations
    UNION ALL SELECT 'Rooms', COUNT(*) FROM dbo.Rooms
    UNION ALL SELECT 'Doctors', COUNT(*) FROM dbo.Doctors
    UNION ALL SELECT 'DoctorSchedules', COUNT(*) FROM dbo.DoctorSchedules
    UNION ALL SELECT 'TimeSlots', COUNT(*) FROM dbo.TimeSlots
    UNION ALL SELECT 'Appointments', COUNT(*) FROM dbo.Appointments
    UNION ALL SELECT 'MedicineCategories', COUNT(*) FROM dbo.MedicineCategories
    UNION ALL SELECT 'Suppliers', COUNT(*) FROM dbo.Suppliers
    UNION ALL SELECT 'Medicines', COUNT(*) FROM dbo.Medicines
    UNION ALL SELECT 'Inventory', COUNT(*) FROM dbo.Inventory
    UNION ALL SELECT 'LabTestTypes', COUNT(*) FROM dbo.LabTestTypes
    UNION ALL SELECT 'LabTests', COUNT(*) FROM dbo.LabTests
    UNION ALL SELECT 'LabTestResults', COUNT(*) FROM dbo.LabTestResults
    UNION ALL SELECT 'Diseases', COUNT(*) FROM dbo.Diseases
    UNION ALL SELECT 'MedicalRecords', COUNT(*) FROM dbo.MedicalRecords
    UNION ALL SELECT 'RecordDiagnoses', COUNT(*) FROM dbo.RecordDiagnoses;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

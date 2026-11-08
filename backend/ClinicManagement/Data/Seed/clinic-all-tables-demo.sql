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
       OR OBJECT_ID('dbo.Patients', 'U') IS NULL
       OR OBJECT_ID('dbo.PatientBooks', 'U') IS NULL
       OR OBJECT_ID('dbo.BookInvoices', 'U') IS NULL
       OR OBJECT_ID('dbo.PurchaseOrders', 'U') IS NULL
       OR OBJECT_ID('dbo.PurchaseOrderDetails', 'U') IS NULL
       OR OBJECT_ID('dbo.DispenseDetails', 'U') IS NULL
       OR NOT EXISTS (SELECT 1 FROM dbo.__EFMigrationsHistory WHERE MigrationId = '20260926172919_AddLabTechnicianRole')
       OR NOT EXISTS (SELECT 1 FROM dbo.__EFMigrationsHistory WHERE MigrationId = '20260928063651_AddReceptionCheckInBooks')
       OR NOT EXISTS (SELECT 1 FROM dbo.__EFMigrationsHistory WHERE MigrationId = '20261006063841_AddPurchaseOrders')
       OR NOT EXISTS (SELECT 1 FROM dbo.__EFMigrationsHistory WHERE MigrationId = '20261006174653_AddPrescriptionDispensing')
        THROW 51000, 'Apply all EF migrations before running clinic-all-tables-demo.sql.', 1;

    -- Reused demo user IDs must not accept access tokens issued before this reset.
    DECLARE @securityVersion int = COALESCE((SELECT MAX(SecurityVersion) FROM dbo.Users), 0);
    SET @securityVersion = CASE WHEN @securityVersion >= 2147483647 THEN 1 ELSE @securityVersion + 1 END;

    -- Delete children before parents. Constraints and migration metadata stay intact.
    DELETE FROM dbo.RbacAudits;
    IF OBJECT_ID(N'dbo.Notifications', N'U') IS NOT NULL
        DELETE FROM dbo.Notifications;
    DELETE FROM dbo.LabTestResults;
    DELETE FROM dbo.LabTests;
    DELETE FROM dbo.DispenseDetails;
    IF OBJECT_ID(N'dbo.PrescriptionStockReviewDecisions', N'U') IS NOT NULL
        DELETE FROM dbo.PrescriptionStockReviewDecisions;
    IF OBJECT_ID(N'dbo.PrescriptionStockReviews', N'U') IS NOT NULL
        DELETE FROM dbo.PrescriptionStockReviews;
    DELETE FROM dbo.InvoiceDetails;
    DELETE FROM dbo.Invoices;
    DELETE FROM dbo.PrescriptionDetails;
    DELETE FROM dbo.Prescriptions;
    DELETE FROM dbo.RecordDiagnoses;
    DELETE FROM dbo.MedicalRecords;
    DELETE FROM dbo.Appointments;
    IF OBJECT_ID(N'dbo.PatientBookRequests', N'U') IS NOT NULL
        DELETE FROM dbo.PatientBookRequests;
    DELETE FROM dbo.PatientBooks;
    DELETE FROM dbo.BookInvoices;
    DELETE FROM dbo.Patients;
    DELETE FROM dbo.TimeSlots;
    DELETE FROM dbo.DoctorSchedules;
    DELETE FROM dbo.DoctorScheduleRequests;
    DELETE FROM dbo.PurchaseOrderDetails;
    DELETE FROM dbo.PurchaseOrders;
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
    DECLARE @clinicNow datetime2 = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time' AS datetime2);

    SET IDENTITY_INSERT dbo.Roles ON;
    INSERT INTO dbo.Roles (RoleId, RoleName, Description, IsSystem) VALUES
        (1, 'Admin', 'System administrator', 1),
        (2, 'Doctor', 'Doctor', 1),
        (3, 'Receptionist', 'Receptionist', 1),
        (4, 'Patient', 'Patient', 1),
        (5, 'LabTechnician', 'Lab technician', 1),
        (6, 'DepartmentHead', 'Department head and doctor', 1),
        (7, 'Pharmacist', 'Pharmacist', 1);
    INSERT INTO dbo.Roles (RoleId, RoleName, Description)
    SELECT 1000+n, CONCAT('DemoRole', RIGHT(CONCAT('0', n), 2)),
           'Reserved demo role; not assignable through the API'
    FROM @n WHERE n BETWEEN 8 AND 20;
    SET IDENTITY_INSERT dbo.Roles OFF;

    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 1, Code FROM dbo.Permissions WHERE Code NOT IN
        ('appointments.viewOwn','appointments.bookSelf','appointments.cancelOwn','clinical.viewOwn',
         'pharmacy.viewOwnPrescription','labs.viewOwnResult','billing.viewOwn',
         'labs.order','labs.enterResult','labs.viewPending','reports.departmentStatistics','schedules.viewDepartment');
    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 2, Code FROM dbo.Permissions WHERE Code IN
        ('appointments.startExamination','clinical.viewAssigned','clinical.writeRecord','clinical.editDiagnosis',
         'pharmacy.viewInventory','pharmacy.viewCatalog','pharmacy.prescribe',
         'labs.viewTypes','labs.viewOrders','labs.order');
    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 3, Code FROM dbo.Permissions WHERE Code IN
        ('appointments.view','appointments.createWalkIn','appointments.confirm','appointments.reschedule',
         'appointments.checkIn','billing.view','billing.create','billing.recordPayment');
    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 4, Code FROM dbo.Permissions WHERE Code IN
        ('appointments.viewOwn','appointments.bookSelf','appointments.cancelOwn','clinical.viewOwn',
         'pharmacy.viewOwnPrescription','labs.viewOrders','labs.viewOwnResult','billing.viewOwn');
    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 5, Code FROM dbo.Permissions WHERE Code IN
        ('labs.viewOrders','labs.viewPending','labs.start','labs.enterResult');
    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 6, Code FROM dbo.Permissions WHERE Code IN
        ('schedules.viewDepartment','reports.departmentStatistics','schedules.review','appointments.startExamination','clinical.viewAssigned','clinical.writeRecord',
         'clinical.editDiagnosis','clinical.manageDiseases','pharmacy.viewInventory','pharmacy.viewCatalog',
         'pharmacy.prescribe','labs.viewTypes','labs.viewOrders','labs.order');
    INSERT INTO dbo.RolePermissions (RoleId, PermissionCode)
    SELECT 7, Code FROM dbo.Permissions WHERE Code IN
        ('pharmacy.viewInventory','pharmacy.viewCatalog','pharmacy.dispense');

    DECLARE @departmentNames TABLE (n int PRIMARY KEY, Code varchar(30), Name nvarchar(150), Description nvarchar(500));
    INSERT INTO @departmentNames VALUES
        (1,'NOI',N'Nội tổng quát',N'Khám và đánh giá sức khỏe tổng thể, tiếp nhận các triệu chứng chưa rõ chuyên khoa và theo dõi bệnh nội khoa thường gặp. Bác sĩ kết hợp tiền sử bệnh, thăm khám và kết quả cận lâm sàng để định hướng chăm sóc, tái khám hoặc chuyển chuyên khoa khi cần.'),
        (2,'NHI',N'Nhi khoa',N'Chăm sóc sức khỏe trẻ em, khám các bệnh thường gặp và theo dõi sự phát triển thể chất. Nội dung thăm khám có thể gồm vấn đề hô hấp, tiêu hóa, dinh dưỡng và hướng dẫn chăm sóc phù hợp với từng giai đoạn phát triển của trẻ.'),
        (3,'RHM',N'Răng hàm mặt',N'Khám và đánh giá các vấn đề về răng, nướu và vùng hàm mặt; tư vấn vệ sinh răng miệng và theo dõi sức khỏe răng định kỳ. Bác sĩ trao đổi về tình trạng răng miệng, nhu cầu chăm sóc và hướng xử trí phù hợp sau khi thăm khám.'),
        (4,'TIM',N'Tim mạch',N'Khám và theo dõi các bệnh lý tim mạch như tăng huyết áp, rối loạn lipid máu, bệnh mạch vành và rối loạn nhịp tim. Đánh giá triệu chứng, yếu tố nguy cơ và kết quả thăm dò giúp bác sĩ xây dựng kế hoạch chăm sóc phù hợp.'),
        (5,'HOHAP',N'Hô hấp',N'Khám các vấn đề đường hô hấp như ho kéo dài, khò khè, hen phế quản và bệnh phổi tắc nghẽn mạn tính. Việc thăm khám kết hợp khai thác yếu tố dị ứng, môi trường sống và các kết quả thăm dò chức năng hô hấp đã có.'),
        (6,'TIEUHOA',N'Tiêu hóa',N'Khám các bệnh lý đường tiêu hóa, gan và mật; đánh giá đau bụng, rối loạn tiêu hóa, trào ngược và các vấn đề gan mạn tính. Bác sĩ xem xét tiền sử, kết quả xét nghiệm, siêu âm hoặc nội soi để định hướng theo dõi.'),
        (7,'NOITIET',N'Nội tiết',N'Khám và theo dõi rối loạn nội tiết, chuyển hóa như đái tháo đường, bệnh tuyến giáp và rối loạn lipid máu. Việc theo dõi lâu dài dựa trên triệu chứng, diễn biến chỉ số xét nghiệm và đáp ứng của từng người bệnh.'),
        (8,'DALIEU',N'Da liễu',N'Khám các vấn đề về da, tóc và móng; đánh giá tổn thương da, ngứa và những thay đổi kéo dài hoặc tái phát. Bác sĩ ghi nhận diễn biến, sản phẩm đang sử dụng và yếu tố tiếp xúc để tư vấn chăm sóc phù hợp.'),
        (9,'MAT',N'Mắt',N'Khám và kiểm tra sức khỏe mắt, tiếp nhận các vấn đề về thị lực, khó chịu ở mắt và nhu cầu theo dõi định kỳ. Thông tin về kính đang sử dụng, bệnh nền và kết quả khám trước giúp bác sĩ đánh giá tình trạng hiện tại.'),
        (10,'TMH',N'Tai mũi họng',N'Khám các vấn đề tại tai, mũi, xoang và họng, bao gồm tình trạng khó chịu kéo dài hoặc tái phát. Bác sĩ đánh giá triệu chứng, khả năng nghe, giọng nói và tiền sử điều trị để định hướng thăm khám phù hợp.'),
        (11,'CXYK',N'Cơ xương khớp',N'Khám và theo dõi các bệnh lý cơ, xương, khớp như thoái hóa khớp, gout, viêm khớp và loãng xương. Việc đánh giá kết hợp mức độ đau, khả năng vận động và kết quả xét nghiệm hoặc chẩn đoán hình ảnh.'),
        (12,'THANKINH',N'Thần kinh',N'Khám và đánh giá các triệu chứng liên quan đến hệ thần kinh; theo dõi những thay đổi về cảm giác, vận động và sinh hoạt. Bác sĩ kết hợp tiền sử, thăm khám và kết quả cận lâm sàng để định hướng chăm sóc hoặc khám chuyên khoa sâu hơn.'),
        (13,'SAN',N'Sản phụ khoa',N'Chăm sóc sức khỏe phụ nữ, khám và theo dõi thai kỳ, đánh giá các bệnh lý phụ khoa và sức khỏe sinh sản. Nội dung thăm khám được trao đổi theo độ tuổi, tiền sử và nhu cầu riêng của từng người bệnh.'),
        (14,'NIEU',N'Tiết niệu',N'Khám và đánh giá các vấn đề của hệ tiết niệu, tiếp nhận thay đổi khi đi tiểu và nhu cầu theo dõi bệnh đã được chẩn đoán. Bác sĩ đối chiếu triệu chứng, kết quả xét nghiệm nước tiểu và chẩn đoán hình ảnh khi có.'),
        (15,'DINHDUONG',N'Dinh dưỡng',N'Đánh giá tình trạng dinh dưỡng theo độ tuổi, thể trạng và nhu cầu sức khỏe; trao đổi về chế độ ăn và thói quen sinh hoạt. Nội dung tư vấn dựa trên thông tin ăn uống, diễn biến cân nặng và bệnh nền của từng người.'),
        (16,'YHCT',N'Y học cổ truyền',N'Thăm khám và tư vấn chăm sóc sức khỏe theo y học cổ truyền, kết hợp xem xét bệnh sử và các phương pháp đang điều trị. Bác sĩ đánh giá thể trạng, nhu cầu của người bệnh và khả năng phối hợp với các chuyên khoa liên quan.'),
        (17,'PHCN',N'Phục hồi chức năng',N'Đánh giá chức năng vận động và mức độ ảnh hưởng đến sinh hoạt, từ đó trao đổi mục tiêu phục hồi phù hợp. Bác sĩ xem xét tình trạng sau chấn thương, sau điều trị hoặc hạn chế vận động để xây dựng kế hoạch theo dõi.'),
        (18,'CAPCUU',N'Cấp cứu',N'Tiếp nhận và đánh giá ban đầu những tình trạng cần hỗ trợ y tế khẩn, ưu tiên theo mức độ nghiêm trọng. Thông tin người bệnh, bệnh nền, thuốc đang dùng và diễn biến gần nhất giúp nhân viên y tế phối hợp xử trí hoặc chuyển tuyến.'),
        (19,'XETNGHIEM',N'Xét nghiệm',N'Cung cấp thông tin cận lâm sàng phục vụ đánh giá sức khỏe, hỗ trợ chẩn đoán và theo dõi điều trị. Các nhóm xét nghiệm thường liên quan đến huyết học, sinh hóa, miễn dịch và nước tiểu; danh mục, chi phí được công bố ở trang dịch vụ.'),
        (20,'CDHA',N'Chẩn đoán hình ảnh',N'Sử dụng hình ảnh y học để hỗ trợ đánh giá cấu trúc cơ thể, chẩn đoán và theo dõi điều trị. Các nhóm kỹ thuật gồm siêu âm, X-quang và những thăm dò chuyên sâu theo chỉ định; dịch vụ thực hiện được xác nhận khi đăng ký.');
    SET IDENTITY_INSERT dbo.Departments ON;
    INSERT INTO dbo.Departments (DepartmentId, Code, Name, Description, IsActive, CreatedAt, UpdatedAt)
    SELECT 1000+n, Code, Name, Description, 1, @now, @now FROM @departmentNames;
    SET IDENTITY_INSERT dbo.Departments OFF;

    SET IDENTITY_INSERT dbo.Specializations ON;
    INSERT INTO dbo.Specializations (SpecializationId, Code, Name, Description, DepartmentId, IsActive, CreatedAt, UpdatedAt)
    SELECT 1000+n, CONCAT('CK-', Code), CONCAT(N'Chuyên khoa ', Name), Description,
           1000+n, 1, @now, @now FROM @departmentNames;
    SET IDENTITY_INSERT dbo.Specializations OFF;

    SET IDENTITY_INSERT dbo.Rooms ON;
    INSERT INTO dbo.Rooms (RoomId, RoomNumber, Name, RoomType, DepartmentId, Location, IsActive, CreatedAt, UpdatedAt)
    SELECT 1000+n, CONCAT('P', 100+n), CONCAT(N'Phòng khám ', Name),
           N'Khám bệnh', 1000+n, CONCAT(N'Tầng ', 1+(n-1)/5), 1, @now, @now
    FROM @departmentNames;
    SET IDENTITY_INSERT dbo.Rooms OFF;

    SET IDENTITY_INSERT dbo.Doctors ON;
    INSERT INTO dbo.Doctors (DoctorId, FullName, Title, ExperienceYears, Biography, IsActive, DepartmentId, SpecializationId)
    SELECT 1000+n, CONCAT(N'Bác sĩ mẫu ', RIGHT(CONCAT('0', n), 2)),
           CASE WHEN n%3=0 THEN 'ThS.BS' ELSE 'BS.CKI' END, 4+n%16,
           CONCAT(N'Khám và điều trị ', Name), 1, 1000+n, 1000+n
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

    INSERT INTO dbo.DoctorSchedules (ScheduleId, DoctorId, RoomId, WorkDate, StartTime, EndTime, RequestId, Shift, MaxPatients, IsActive, Status, CreatedAt)
    SELECT CONVERT(uniqueidentifier, CONCAT('00000000-0000-0000-0000-', RIGHT(CONCAT('000000000000', 1000+n), 12))),
           1000+n, 1000+n,
           CASE WHEN n BETWEEN 1 AND 4 OR n BETWEEN 17 AND 20 THEN @today
                ELSE DATEADD(day, n-4, @today) END,
           CASE WHEN n <= 4 THEN CAST('09:00:00' AS time) ELSE CAST('08:00:00' AS time) END,
           CASE WHEN n <= 4 THEN CAST('09:30:00' AS time) ELSE CAST('08:30:00' AS time) END,
           1000+n, 'Morning', 1, 1, 'Approved', @now FROM @n;

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
           CASE n WHEN 1 THEN N'Quản trị viên mẫu' WHEN 2 THEN N'Bác sĩ mẫu'
                  WHEN 3 THEN N'Lễ tân mẫu' WHEN 5 THEN N'Kỹ thuật viên xét nghiệm mẫu'
                  ELSE CONCAT(N'Bệnh nhân mẫu ', RIGHT(CONCAT('0', n), 2)) END,
           CONCAT('demo-user', RIGHT(CONCAT('0', n), 2), '@example.test'),
           CONCAT('090000', RIGHT(CONCAT('0000', n), 4)),
           CASE n WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3 WHEN 5 THEN 5 ELSE 4 END,
           1, @securityVersion, @now
    FROM @n;
    INSERT INTO dbo.Users
        (UserId, Username, PasswordHash, FullName, Email, Phone,
         RoleId, Status, SecurityVersion, CreatedAt)
    VALUES
        (1021, 'demo_pharmacist', @hash, N'Dược sĩ mẫu',
         'demo-pharmacist@example.test', '0900001021',
         7, 1, @securityVersion, @now);
    SET IDENTITY_INSERT dbo.Users OFF;

    UPDATE dbo.Doctors SET UserId = 1002 WHERE DoctorId = 1005;

    SET IDENTITY_INSERT dbo.Patients ON;
    INSERT INTO dbo.Patients
        (PatientId, FullName, Phone, BirthDate, IdentityNumber,
         InsuranceCode, CreatedAt, UserId)
    SELECT UserId, FullName, Phone,
           DATEADD(year, -(25 + UserId % 15), @today),
           CONCAT('0792', RIGHT(CONCAT('00000000', UserId), 8)),
           CONCAT('DN', RIGHT(CONCAT('00000000', UserId), 8)),
           @clinicNow, UserId
    FROM dbo.Users
    WHERE RoleId = 4;
    SET IDENTITY_INSERT dbo.Patients OFF;

    SET IDENTITY_INSERT dbo.PatientBooks ON;
    INSERT INTO dbo.PatientBooks
        (PatientBookId, IssuedAt, CreatedAt, UpdatedAt, PatientId,
         BookNumber, Status)
    SELECT PatientId, DATEADD(day, -30, @clinicNow),
           DATEADD(day, -30, @clinicNow), @clinicNow, PatientId,
           CONCAT('PB-', YEAR(@today), '-', RIGHT(CONCAT('0000', PatientId), 4)),
           'Issued'
    FROM dbo.Patients
    WHERE PatientId BETWEEN 1006 AND 1009;
    SET IDENTITY_INSERT dbo.PatientBooks OFF;

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
           N'Khám và tư vấn sức khỏe',
           CASE WHEN a.n <= 16 THEN 'Completed' WHEN a.n <= 20 THEN 'InProgress'
                WHEN a.n%2=1 THEN 'Pending' ELSE 'Confirmed' END,
           DATEADD(day, -7, @now)
    FROM @appointments AS a
    JOIN dbo.Users AS p ON p.UserId = CASE WHEN (a.n-1)%16=0 THEN 1004 ELSE 1005+(a.n-1)%16 END;

    -- Daily examination queue for demo_doctor (DoctorId 1005).
    -- @today is evaluated in the clinic time zone each time this seed runs.
    INSERT INTO dbo.Appointments
        (AppointmentId, DoctorId, PatientId, PatientName, PatientPhone,
         PatientProfileId, PatientBookId, BookVerifiedAt, CheckedInAt,
         AppointmentDate, StartTime, EndTime, Reason, Status, CreatedAt)
    SELECT 1025, 1005, UserId, FullName, Phone,
           UserId, UserId, @clinicNow, @clinicNow, @today,
           CAST('08:30:00' AS time), CAST('08:45:00' AS time),
           N'Khám đau đầu và mệt mỏi', 'Confirmed', @clinicNow
    FROM dbo.Users WHERE UserId = 1006
    UNION ALL
    SELECT 1026, 1005, UserId, FullName, Phone,
           UserId, UserId, @clinicNow, @clinicNow, @today,
           CAST('09:00:00' AS time), CAST('09:15:00' AS time),
           N'Tái khám huyết áp', 'Confirmed', @clinicNow
    FROM dbo.Users WHERE UserId = 1007
    UNION ALL
    SELECT 1027, 1005, UserId, FullName, Phone,
           UserId, UserId, @clinicNow, @clinicNow, @today,
           CAST('09:30:00' AS time), CAST('09:45:00' AS time),
           N'Khám ho và đau họng', 'InProgress', @clinicNow
    FROM dbo.Users WHERE UserId = 1008
    UNION ALL
    SELECT 1028, 1005, UserId, FullName, Phone,
           UserId, UserId, @clinicNow, @clinicNow, @today,
           CAST('10:00:00' AS time), CAST('10:15:00' AS time),
           N'Khám đau bụng', 'Completed', @clinicNow
    FROM dbo.Users WHERE UserId = 1009;
    SET IDENTITY_INSERT dbo.Appointments OFF;

    DECLARE @medicineNames TABLE (n int PRIMARY KEY, Name nvarchar(150), Unit nvarchar(20));
    INSERT INTO @medicineNames VALUES
        (1,N'Paracetamol 500mg',N'Viên'),(2,N'Amoxicillin 500mg',N'Viên'),
        (3,N'Amlodipine 5mg',N'Viên'),(4,N'Metformin 500mg',N'Viên'),
        (5,N'Omeprazole 20mg',N'Viên'),(6,N'Cetirizine 10mg',N'Viên'),
        (7,N'Ibuprofen 400mg',N'Viên'),(8,N'Azithromycin 250mg',N'Viên'),
        (9,N'Losartan 50mg',N'Viên'),(10,N'Salbutamol 100mcg',N'Bình'),
        (11,N'Vitamin C 500mg',N'Viên'),(12,N'ORS 5.6g',N'Gói'),
        (13,N'Insulin glargine',N'Bút'),(14,N'Chlorpheniramine 4mg',N'Viên'),
        (15,N'Diclofenac 50mg',N'Viên'),(16,N'Atorvastatin 20mg',N'Viên'),
        (17,N'Cefuroxime 500mg',N'Viên'),(18,N'Prednisolone 5mg',N'Viên'),
        (19,N'Folic acid 5mg',N'Viên'),(20,N'B-complex',N'Viên');
    DECLARE @categoryNames TABLE (n int PRIMARY KEY, Name nvarchar(100));
    INSERT INTO @categoryNames VALUES
        (1,N'Giảm đau hạ sốt'),(2,N'Kháng sinh Penicillin'),(3,N'Tim mạch'),
        (4,N'Điều trị đái tháo đường'),(5,N'Dạ dày'),(6,N'Dị ứng'),
        (7,N'Kháng viêm không steroid'),(8,N'Kháng sinh Macrolide'),
        (9,N'Điều trị tăng huyết áp'),(10,N'Hô hấp'),(11,N'Vitamin C'),
        (12,N'Bù nước điện giải'),(13,N'Insulin'),(14,N'Kháng histamine'),
        (15,N'Cơ xương khớp'),(16,N'Hạ lipid máu'),(17,N'Kháng sinh Cephalosporin'),
        (18,N'Corticosteroid'),(19,N'Acid folic'),(20,N'Vitamin tổng hợp');
    SET IDENTITY_INSERT dbo.MedicineCategories ON;
    INSERT INTO dbo.MedicineCategories (CategoryId, CategoryName)
    SELECT 1000+n, Name FROM @categoryNames;
    SET IDENTITY_INSERT dbo.MedicineCategories OFF;

    SET IDENTITY_INSERT dbo.Suppliers ON;
    INSERT INTO dbo.Suppliers (SupplierId, SupplierName, ContactInfo, Address)
    SELECT 1000+n, CONCAT(N'Nhà cung cấp mẫu ', n),
           CONCAT('090000', RIGHT(CONCAT('0000', n), 4)), N'Địa chỉ nhà cung cấp mẫu'
    FROM @n;
    SET IDENTITY_INSERT dbo.Suppliers OFF;

    SET IDENTITY_INSERT dbo.Medicines ON;
    INSERT INTO dbo.Medicines (MedicineId, MedicineName, CategoryId, SupplierId, Unit, UnitPrice, Description)
    SELECT 1000+n, Name, 1000+n, 1000+n, Unit,
           CAST(5000+n*2500 AS decimal(18,2)), N'Thuốc mẫu cho môi trường phát triển'
    FROM @medicineNames;
    SET IDENTITY_INSERT dbo.Medicines OFF;

    SET IDENTITY_INSERT dbo.Inventory ON;
    INSERT INTO dbo.Inventory (InventoryId, MedicineId, BatchNumber, QuantityInStock, ExpiryDate)
    SELECT 1000+n, 1000+n, CONCAT('DEMO-BATCH-', RIGHT(CONCAT('0', n), 2)),
           CASE WHEN n=1 THEN 0 WHEN n IN (2,3) THEN 4 ELSE 30+n*3 END,
           CASE WHEN n IN (4,8) THEN DATEADD(day, 15, @today)
                ELSE DATEADD(day, 365+n, @today) END
    FROM @n;
    INSERT INTO dbo.Inventory
        (InventoryId, MedicineId, BatchNumber, QuantityInStock, ExpiryDate)
    VALUES
        (1021, 1002, 'DEMO-FEFO-02A', 2, DATEADD(day, 60, @today));
    SET IDENTITY_INSERT dbo.Inventory OFF;

    SET IDENTITY_INSERT dbo.PurchaseOrders ON;
    INSERT INTO dbo.PurchaseOrders
        (PurchaseOrderId, SupplierId, OrderDate, TotalAmount, Status, Notes,
         CreatedByUserId, ReceivedByUserId, ReceivedAt, CreatedAt, UpdatedAt)
    VALUES
        (1001, 1001, DATEADD(day, -1, @today), 150000, 'Draft',
         N'Phiếu mẫu đang chờ xác nhận nhập kho', 1001, NULL, NULL,
         DATEADD(day, -1, @now), DATEADD(day, -1, @now)),
        (1002, 1002, DATEADD(day, -3, @today), 150000, 'Received',
         N'Phiếu mẫu đã nhập kho', 1001, 1001, DATEADD(day, -2, @now),
         DATEADD(day, -3, @now), DATEADD(day, -2, @now)),
        (1003, 1003, DATEADD(day, -5, @today), 100000, 'Cancelled',
         N'Phiếu mẫu đã hủy', 1001, NULL, NULL,
         DATEADD(day, -5, @now), DATEADD(day, -4, @now));
    SET IDENTITY_INSERT dbo.PurchaseOrders OFF;

    SET IDENTITY_INSERT dbo.PurchaseOrderDetails ON;
    INSERT INTO dbo.PurchaseOrderDetails
        (PurchaseOrderDetailId, PurchaseOrderId, MedicineId, Quantity,
         UnitPrice, BatchNumber, ExpiryDate)
    VALUES
        (1001, 1001, 1001, 20, 7500, 'PO-DEMO-01', DATEADD(day, 540, @today)),
        (1002, 1002, 1002, 15, 10000, 'PO-DEMO-02', DATEADD(day, 600, @today)),
        (1003, 1003, 1003, 8, 12500, 'PO-DEMO-03', DATEADD(day, 660, @today));
    SET IDENTITY_INSERT dbo.PurchaseOrderDetails OFF;

    DECLARE @labNames TABLE (n int PRIMARY KEY, Name nvarchar(200));
    INSERT INTO @labNames VALUES
        (1,N'Công thức máu'),(2,N'Đường huyết'),(3,N'HbA1c'),(4,N'Mỡ máu'),
        (5,N'Chức năng gan'),(6,N'Chức năng thận'),(7,N'Tổng phân tích nước tiểu'),
        (8,N'CRP'),(9,N'Acid uric'),(10,N'Điện giải đồ'),(11,N'TSH'),
        (12,N'FT4'),(13,N'Ferritin'),(14,N'Vitamin D'),(15,N'HBsAg'),
        (16,N'Anti HCV'),(17,N'Troponin I'),(18,N'PSA'),(19,N'Beta hCG'),
        (20,N'Máu lắng');
    SET IDENTITY_INSERT dbo.LabTestTypes ON;
    INSERT INTO dbo.LabTestTypes (Id, Name, Description, Price, IsActive, CreatedAt, UpdatedAt)
    SELECT 1000+n, Name, N'Xét nghiệm trong danh mục dịch vụ của phòng khám.',
           CAST(40000+n*7500 AS decimal(18,2)), 1, @now, NULL FROM @labNames;
    SET IDENTITY_INSERT dbo.LabTestTypes OFF;

    DECLARE @diseases TABLE (n int PRIMARY KEY, Code varchar(30), Name nvarchar(150));
    INSERT INTO @diseases VALUES
        (1,'I10',N'Tăng huyết áp'),(2,'E11',N'Đái tháo đường type 2'),
        (3,'J06',N'Nhiễm khuẩn hô hấp trên'),(4,'J45',N'Hen phế quản'),
        (5,'K29',N'Viêm dạ dày'),(6,'M54',N'Đau lưng'),
        (7,'E78',N'Rối loạn lipid máu'),(8,'J02',N'Viêm họng cấp'),
        (9,'K21',N'Trào ngược dạ dày'),(10,'N39',N'Nhiễm trùng tiết niệu'),
        (11,'L20',N'Viêm da cơ địa'),(12,'H10',N'Viêm kết mạc'),
        (13,'G43',N'Đau nửa đầu'),(14,'M17',N'Thoái hóa khớp gối'),
        (15,'D50',N'Thiếu máu thiếu sắt'),(16,'B18',N'Viêm gan virus mạn'),
        (17,'R07',N'Đau ngực'),(18,'R51',N'Đau đầu'),
        (19,'A09',N'Tiêu chảy cấp'),(20,'I25',N'Bệnh mạch vành');
    SET IDENTITY_INSERT dbo.Diseases ON;
    INSERT INTO dbo.Diseases (DiseaseId, DiseaseCode, DiseaseName, Description, IsActive, CreatedAt)
    SELECT 1000+n, Code, Name, N'Chẩn đoán mẫu cho hồ sơ khám', 1, @now FROM @diseases;
    SET IDENTITY_INSERT dbo.Diseases OFF;

    SET IDENTITY_INSERT dbo.MedicalRecords ON;
    INSERT INTO dbo.MedicalRecords
        (MedicalRecordId, AppointmentId, DoctorId, PatientId, ExaminationDate,
         Symptoms, Conclusion, CreatedAt, UpdatedAt)
    SELECT 1000+n, 1000+n, a.DoctorId, a.PatientId, a.AppointmentDate,
           CONCAT(N'Triệu chứng cần đánh giá lần ', n),
           CASE WHEN n <= 16 THEN N'Đã khám và hướng dẫn theo dõi' ELSE NULL END,
           @now, @now
    FROM @n JOIN dbo.Appointments AS a ON a.AppointmentId = 1000+n;

    INSERT INTO dbo.MedicalRecords
        (MedicalRecordId, AppointmentId, DoctorId, PatientId, ExaminationDate,
         Symptoms, Conclusion, PatientBookId, PaperBookUpdatedAt,
         CreatedAt, UpdatedAt)
    VALUES
        (1021, 1027, 1005, 1008, @today,
         N'Ho, đau họng và mệt mỏi trong hai ngày', NULL, 1008, NULL,
         @clinicNow, @clinicNow),
        (1022, 1028, 1005, 1009, @today,
         N'Đau bụng nhẹ sau bữa ăn', N'Rối loạn tiêu hóa nhẹ, theo dõi tại nhà',
         1009, @clinicNow, @clinicNow, @clinicNow);
    SET IDENTITY_INSERT dbo.MedicalRecords OFF;

    -- Dispensing demo scenarios: unpaid, paid/ready, paid/insufficient,
    -- and already dispensed with recorded lot history.
    SET IDENTITY_INSERT dbo.Prescriptions ON;
    INSERT INTO dbo.Prescriptions
        (PrescriptionId, MedicalRecordId, PrescriptionDate, Status,
         DispensedAt, DispensedByUserId, Notes, CreatedAt, UpdatedAt)
    VALUES
        (1001, 1017, @clinicNow, 'Issued', NULL, NULL,
         N'Đơn chờ thanh toán để kiểm tra khóa cấp thuốc.', @clinicNow, @clinicNow),
        (1002, 1018, @clinicNow, 'Issued', NULL, NULL,
         N'Uống thuốc đúng giờ và đúng liều đã kê.', @clinicNow, @clinicNow),
        (1003, 1019, @clinicNow, 'Issued', NULL, NULL,
         N'Đơn đã thanh toán nhưng tồn kho chưa đáp ứng.', @clinicNow, @clinicNow),
        (1004, 1020, @clinicNow, 'Dispensed', @clinicNow, 1021,
         N'Đơn mẫu đã giao thuốc và ghi nhận lô xuất.', @clinicNow, @clinicNow);
    SET IDENTITY_INSERT dbo.Prescriptions OFF;

    SET IDENTITY_INSERT dbo.PrescriptionDetails ON;
    INSERT INTO dbo.PrescriptionDetails
        (PrescriptionDetailId, PrescriptionId, MedicineId, Dosage,
         Quantity, Instructions)
    VALUES
        (1001, 1001, 1005, N'Sáng 1 viên', 3, N'Uống trước bữa sáng 30 phút'),
        (1002, 1002, 1002, N'Sáng 1 viên', 5, N'Uống sau ăn'),
        (1003, 1002, 1003, N'Tối 1 viên', 2, N'Uống sau ăn tối'),
        (1004, 1003, 1001, N'Khi đau 1 viên', 10, N'Không quá liều chỉ định'),
        (1005, 1004, 1006, N'Tối 1 viên', 2, N'Uống sau ăn');
    SET IDENTITY_INSERT dbo.PrescriptionDetails OFF;

    SET IDENTITY_INSERT dbo.Invoices ON;
    INSERT INTO dbo.Invoices
        (Id, AppointmentId, PatientId, CashierId, BillingStage,
         TotalAmount, InsuranceDiscountPercent, InsuranceAmount, PatientAmount,
         PaymentMethod, Status, CreatedAt)
    VALUES
        (1001, 1018, 1006, 1001, 'Medicine', 75000, 0, 0, 75000, 'Cash', 'Paid', @clinicNow),
        (1002, 1019, 1007, 1001, 'Final', 75000, 0, 0, 75000, 'Transfer', 'Paid', @clinicNow),
        (1003, 1020, 1008, 1001, 'Medicine', 40000, 0, 0, 40000, 'Cash', 'Paid', @clinicNow);
    SET IDENTITY_INSERT dbo.Invoices OFF;

    SET IDENTITY_INSERT dbo.InvoiceDetails ON;
    INSERT INTO dbo.InvoiceDetails
        (Id, InvoiceId, SourceType, SourceId, ItemName,
         UnitPrice, Quantity, TotalPrice)
    VALUES
        (1001, 1001, 'PrescriptionDetail', 1002, N'Amoxicillin 500mg', 10000, 5, 50000),
        (1002, 1001, 'PrescriptionDetail', 1003, N'Amlodipine 5mg', 12500, 2, 25000),
        (1003, 1002, 'PrescriptionDetail', 1004, N'Paracetamol 500mg', 7500, 10, 75000),
        (1004, 1003, 'PrescriptionDetail', 1005, N'Cetirizine 10mg', 20000, 2, 40000);
    SET IDENTITY_INSERT dbo.InvoiceDetails OFF;

    UPDATE dbo.Inventory
    SET QuantityInStock = QuantityInStock - 2
    WHERE InventoryId = 1006;

    SET IDENTITY_INSERT dbo.DispenseDetails ON;
    INSERT INTO dbo.DispenseDetails
        (DispenseDetailId, PrescriptionDetailId, InventoryId,
         QuantityDispensed)
    VALUES
        (1001, 1005, 1006, 2);
    SET IDENTITY_INSERT dbo.DispenseDetails OFF;

    SET IDENTITY_INSERT dbo.RecordDiagnoses ON;
    INSERT INTO dbo.RecordDiagnoses (RecordDiagnosisId, MedicalRecordId, DiseaseId, IsPrimary, Note)
    SELECT 1000+n, 1000+n, 1000+n, 1, N'Chẩn đoán chính' FROM @n;
    INSERT INTO dbo.RecordDiagnoses (RecordDiagnosisId, MedicalRecordId, DiseaseId, IsPrimary, Note)
    VALUES (1021, 1022, 1005, 1, N'Chẩn đoán mẫu cho lượt khám hoàn tất hôm nay');
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
           N'Kiểm tra theo chỉ định bác sĩ', DATEADD(day, -1-(o.n%5), @now)
    FROM @orders AS o;
    SET IDENTITY_INSERT dbo.LabTests OFF;

    SET IDENTITY_INSERT dbo.LabTestResults ON;
    INSERT INTO dbo.LabTestResults (Id, LabTestId, TechnicianId, ResultSummary, Note, FileUrl, PerformedAt)
    SELECT 1000+n, 1000+n, 1005,
           CONCAT(N'Kết quả mẫu ', RIGHT(CONCAT('0', n), 2), N': trong giới hạn tham chiếu'),
           N'Đã kiểm tra', NULL, DATEADD(hour, 2, DATEADD(day, -1-(n%5), @now))
    FROM @n;
    SET IDENTITY_INSERT dbo.LabTestResults OFF;

    -- No usable refresh token is published by this seed.
    SET IDENTITY_INSERT dbo.RefreshTokens ON;
    INSERT INTO dbo.RefreshTokens (RefreshTokenId, UserId, SecurityVersion, TokenHash, ExpiresAt, RevokedAt)
    SELECT 1000+n, 1000+n,
           @securityVersion, CONVERT(char(64), HASHBYTES('SHA2_256', CONCAT('clinic-demo-revoked-', n)), 2),
           DATEADD(day, -1, @now), @now
    FROM @n;
    INSERT INTO dbo.RefreshTokens
        (RefreshTokenId, UserId, SecurityVersion, TokenHash,
         ExpiresAt, RevokedAt)
    VALUES
        (1021, 1021, @securityVersion,
         CONVERT(char(64), HASHBYTES('SHA2_256', 'clinic-demo-revoked-pharmacist'), 2),
         DATEADD(day, -1, @now), @now);
    SET IDENTITY_INSERT dbo.RefreshTokens OFF;

    -- Keep the next generated IDs predictable even if old data used larger IDs.
    DBCC CHECKIDENT ('dbo.Roles', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.DoctorScheduleRequests', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Users', RESEED, 1021) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.RefreshTokens', RESEED, 1021) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Departments', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Specializations', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Rooms', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Doctors', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Appointments', RESEED, 1028) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Patients', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.PatientBooks', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.BookInvoices', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.MedicineCategories', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Suppliers', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Medicines', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Inventory', RESEED, 1021) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Prescriptions', RESEED, 1004) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.PrescriptionDetails', RESEED, 1005) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.DispenseDetails', RESEED, 1001) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Invoices', RESEED, 1003) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.InvoiceDetails', RESEED, 1004) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.PurchaseOrders', RESEED, 1003) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.PurchaseOrderDetails', RESEED, 1003) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.LabTestTypes', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.LabTests', RESEED, 1025) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.LabTestResults', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Diseases', RESEED, 1020) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.MedicalRecords', RESEED, 1022) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.RecordDiagnoses', RESEED, 1021) WITH NO_INFOMSGS;

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
    UNION ALL SELECT 'Prescriptions', COUNT(*) FROM dbo.Prescriptions
    UNION ALL SELECT 'PrescriptionDetails', COUNT(*) FROM dbo.PrescriptionDetails
    UNION ALL SELECT 'DispenseDetails', COUNT(*) FROM dbo.DispenseDetails
    UNION ALL SELECT 'Invoices', COUNT(*) FROM dbo.Invoices
    UNION ALL SELECT 'InvoiceDetails', COUNT(*) FROM dbo.InvoiceDetails
    UNION ALL SELECT 'PurchaseOrders', COUNT(*) FROM dbo.PurchaseOrders
    UNION ALL SELECT 'PurchaseOrderDetails', COUNT(*) FROM dbo.PurchaseOrderDetails
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

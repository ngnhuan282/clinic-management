SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
SET NOCOUNT ON;

DECLARE @DoctorUsername nvarchar(50) = N'demo_doctor';
DECLARE @Today date = CAST(GETDATE() AS date);
DECLARE @Now datetime2(7) = SYSDATETIME();
DECLARE @BookPrefix nvarchar(20) = N'PB-' + CONVERT(nvarchar(8), @Today, 112) + N'-';

DECLARE @DoctorUserId int;
DECLARE @DoctorRoleId int;
DECLARE @DoctorFullName nvarchar(100);

SELECT
    @DoctorUserId = UserId,
    @DoctorRoleId = RoleId,
    @DoctorFullName = FullName
FROM dbo.Users
WHERE Username = @DoctorUsername;

IF @DoctorUserId IS NULL
BEGIN
    THROW 51000, N'Khong tim thay user bac si can seed. Hay doi @DoctorUsername cho dung tai khoan dang test.', 1;
END;

IF @DoctorRoleId IS NULL
BEGIN
    THROW 51001, N'User bac si chua co RoleId. Hay gan role bac si truoc khi seed.', 1;
END;

DECLARE @RequiredPermissions table
(
    Code nvarchar(80) NOT NULL PRIMARY KEY,
    Module nvarchar(80) NOT NULL,
    Name nvarchar(160) NOT NULL,
    Kind nvarchar(30) NOT NULL,
    Scope nvarchar(250) NULL,
    IsImplemented bit NOT NULL
);

INSERT INTO @RequiredPermissions
    (Code, Module, Name, Kind, Scope, IsImplemented)
VALUES
    (N'appointments.startExamination', N'Lịch hẹn', N'Bắt đầu khám', N'Nghiệp vụ', NULL, 1),
    (N'clinical.viewAssigned', N'Khám bệnh', N'Xem hồ sơ được giao', N'Xem', N'Chỉ hồ sơ thuộc lượt khám được giao', 1),
    (N'clinical.writeRecord', N'Khám bệnh', N'Lập bệnh án', N'Tạo', NULL, 1),
    (N'clinical.editDiagnosis', N'Khám bệnh', N'Cập nhật chẩn đoán', N'Sửa', NULL, 1),
    (N'clinical.manageDiseases', N'Khám bệnh', N'Quản lý danh mục bệnh', N'Sửa', NULL, 1),
    (N'pharmacy.viewInventory', N'Đơn thuốc và kho', N'Xem tồn kho', N'Xem', NULL, 1),
    (N'pharmacy.viewCatalog', N'Đơn thuốc và kho', N'Xem danh mục thuốc', N'Xem', NULL, 1),
    (N'pharmacy.prescribe', N'Đơn thuốc và kho', N'Kê đơn', N'Tạo', NULL, 1),
    (N'labs.viewTypes', N'Xét nghiệm', N'Xem loại xét nghiệm', N'Xem', NULL, 1),
    (N'labs.viewOrders', N'Xét nghiệm', N'Xem chỉ định và kết quả', N'Xem', NULL, 1),
    (N'labs.order', N'Xét nghiệm', N'Chỉ định xét nghiệm', N'Tạo', NULL, 1);

INSERT INTO dbo.Permissions
    (Code, Module, Name, Kind, Scope, IsImplemented)
SELECT
    source.Code,
    source.Module,
    source.Name,
    source.Kind,
    source.Scope,
    source.IsImplemented
FROM @RequiredPermissions AS source
WHERE NOT EXISTS
(
    SELECT 1
    FROM dbo.Permissions AS existing
    WHERE existing.Code = source.Code
);

UPDATE permission
SET IsImplemented = 1
FROM dbo.Permissions AS permission
INNER JOIN @RequiredPermissions AS required
    ON required.Code = permission.Code;

INSERT INTO dbo.RolePermissions
    (RoleId, PermissionCode)
SELECT
    @DoctorRoleId,
    required.Code
FROM @RequiredPermissions AS required
WHERE NOT EXISTS
(
    SELECT 1
    FROM dbo.RolePermissions AS existing
    WHERE existing.RoleId = @DoctorRoleId
      AND existing.PermissionCode = required.Code
);

DECLARE @DepartmentId int;
SELECT TOP (1) @DepartmentId = DepartmentId
FROM dbo.Departments
WHERE Code = N'CARD' OR Name LIKE N'%Tim%';

IF @DepartmentId IS NULL
BEGIN
    INSERT INTO dbo.Departments
        (Code, Name, Description, IsActive, CreatedAt, UpdatedAt)
    VALUES
        (N'CARD', N'Khoa Tim Mạch', N'Khoa khám và theo dõi bệnh lý tim mạch.', 1, @Now, @Now);

    SET @DepartmentId = SCOPE_IDENTITY();
END;

DECLARE @SpecializationId int;
SELECT TOP (1) @SpecializationId = SpecializationId
FROM dbo.Specializations
WHERE Code = N'CARD-GEN' OR Name LIKE N'%Tim%';

IF @SpecializationId IS NULL
BEGIN
    INSERT INTO dbo.Specializations
        (Code, Name, Description, DepartmentId, IsActive, CreatedAt, UpdatedAt)
    VALUES
        (N'CARD-GEN', N'Tim mạch tổng quát', N'Khám và điều trị bệnh lý tim mạch thường gặp.', @DepartmentId, 1, @Now, @Now);

    SET @SpecializationId = SCOPE_IDENTITY();
END;

DECLARE @DoctorId int;
SELECT @DoctorId = DoctorId
FROM dbo.Doctors
WHERE UserId = @DoctorUserId;

IF @DoctorId IS NULL
BEGIN
    INSERT INTO dbo.Doctors
        (FullName, Title, ExperienceYears, Biography, IsActive, DepartmentId, SpecializationId, UserId)
    VALUES
        (COALESCE(NULLIF(@DoctorFullName, N''), N'Bác sĩ Demo'), N'Bác sĩ', 5, N'Tài khoản bác sĩ dùng để test luồng khám bệnh.', 1, @DepartmentId, @SpecializationId, @DoctorUserId);

    SET @DoctorId = SCOPE_IDENTITY();
END
ELSE
BEGIN
    UPDATE dbo.Doctors
    SET
        FullName = COALESCE(NULLIF(@DoctorFullName, N''), FullName),
        IsActive = 1,
        DepartmentId = @DepartmentId,
        SpecializationId = @SpecializationId
    WHERE DoctorId = @DoctorId;
END;

DECLARE @Appointments table
(
    AppointmentKey nvarchar(40) NOT NULL PRIMARY KEY,
    BookNumberSuffix int NOT NULL,
    StartTime time(7) NOT NULL,
    EndTime time(7) NOT NULL,
    PatientName nvarchar(100) NOT NULL,
    PatientPhone nvarchar(15) NOT NULL,
    Reason nvarchar(500) NOT NULL,
    Status nvarchar(20) NOT NULL
);

INSERT INTO @Appointments
    (AppointmentKey, BookNumberSuffix, StartTime, EndTime, PatientName, PatientPhone, Reason, Status)
VALUES
    (N'pending_only', 1, '08:30', '08:45', N'Nguyễn Văn An', N'0912834721', N'Đau thắt ngực khi gắng sức, hồi hộp khó thở 2 ngày', N'Pending'),
    (N'inprogress_incomplete', 2, '08:50', '09:05', N'Đỗ Quốc Huy', N'0935221789', N'Khám sức khỏe tim mạch, theo dõi đái tháo đường type 2', N'InProgress'),
    (N'inprogress_ready', 3, '09:10', '09:25', N'Trần Thị Bích', N'0903567891', N'Tái khám tăng huyết áp định kỳ, cần đo lại HA và chỉnh liều thuốc', N'InProgress'),
    (N'completed_no_rx', 4, '09:30', '09:45', N'Lê Hoàng Nam', N'0988112233', N'Cơn đau ngực lan vai trái, vã mồ hôi, tiền sử xơ vữa mạch vành', N'Completed'),
    (N'completed_with_rx', 5, '10:15', '10:30', N'Phạm Thị Mai', N'0974332115', N'Hồi hộp, tim đập nhanh kèm chóng mặt khi đứng dậy đột ngột', N'Completed'),
    (N'completed_cancelled_rx', 6, '13:30', '13:45', N'Hoàng Thị Lan', N'0918445670', N'Khó thở nhẹ về đêm, khám sàng lọc van tim', N'Completed');

DECLARE @ExistingAppointmentIds table
(
    AppointmentId int NOT NULL PRIMARY KEY
);

INSERT INTO @ExistingAppointmentIds (AppointmentId)
SELECT appointment.AppointmentId
FROM dbo.Appointments AS appointment
INNER JOIN @Appointments AS seed
    ON seed.StartTime = appointment.StartTime
WHERE appointment.DoctorId = @DoctorId
  AND appointment.AppointmentDate = CAST(@Today AS datetime2(7));

DELETE detail
FROM dbo.PrescriptionDetails AS detail
INNER JOIN dbo.Prescriptions AS prescription
    ON prescription.PrescriptionId = detail.PrescriptionId
INNER JOIN dbo.MedicalRecords AS record
    ON record.MedicalRecordId = prescription.MedicalRecordId
INNER JOIN @ExistingAppointmentIds AS seed
    ON seed.AppointmentId = record.AppointmentId;

DELETE prescription
FROM dbo.Prescriptions AS prescription
INNER JOIN dbo.MedicalRecords AS record
    ON record.MedicalRecordId = prescription.MedicalRecordId
INNER JOIN @ExistingAppointmentIds AS seed
    ON seed.AppointmentId = record.AppointmentId;

DELETE diagnosis
FROM dbo.RecordDiagnoses AS diagnosis
INNER JOIN dbo.MedicalRecords AS record
    ON record.MedicalRecordId = diagnosis.MedicalRecordId
INNER JOIN @ExistingAppointmentIds AS seed
    ON seed.AppointmentId = record.AppointmentId;

DELETE record
FROM dbo.MedicalRecords AS record
INNER JOIN @ExistingAppointmentIds AS seed
    ON seed.AppointmentId = record.AppointmentId;

DELETE appointment
FROM dbo.Appointments AS appointment
INNER JOIN @ExistingAppointmentIds AS seed
    ON seed.AppointmentId = appointment.AppointmentId;

DELETE FROM dbo.PatientBooks
WHERE BookNumber LIKE @BookPrefix + N'%';

INSERT INTO dbo.PatientBooks
    (PatientId, BookNumber, Status, PreviousBookId, IssuedAt, CreatedAt, UpdatedAt)
SELECT
    NULL,
    @BookPrefix + RIGHT(N'000' + CAST(BookNumberSuffix AS nvarchar(10)), 3),
    N'Issued',
    NULL,
    @Now,
    @Now,
    @Now
FROM @Appointments;

DECLARE @SeededPatientBooks table
(
    AppointmentKey nvarchar(40) NOT NULL PRIMARY KEY,
    PatientBookId int NOT NULL,
    BookNumber nvarchar(30) NOT NULL
);

INSERT INTO @SeededPatientBooks
    (AppointmentKey, PatientBookId, BookNumber)
SELECT
    appointment.AppointmentKey,
    patientBook.PatientBookId,
    patientBook.BookNumber
FROM @Appointments AS appointment
INNER JOIN dbo.PatientBooks AS patientBook
    ON patientBook.BookNumber =
        @BookPrefix + RIGHT(N'000' + CAST(appointment.BookNumberSuffix AS nvarchar(10)), 3);

INSERT INTO dbo.Appointments
    (DoctorId, PatientId, PatientBookId, PatientName, PatientPhone, AppointmentDate, StartTime, EndTime, Reason, Status, BookVerifiedAt, CreatedAt)
SELECT
    @DoctorId,
    NULL,
    patientBook.PatientBookId,
    PatientName,
    PatientPhone,
    CAST(@Today AS datetime2(7)),
    StartTime,
    EndTime,
    Reason,
    Status,
    @Now,
    @Now
FROM @Appointments AS appointment
INNER JOIN @SeededPatientBooks AS patientBook
    ON patientBook.AppointmentKey = appointment.AppointmentKey;

DECLARE @SeededAppointments table
(
    AppointmentKey nvarchar(40) NOT NULL PRIMARY KEY,
    AppointmentId int NOT NULL
);

INSERT INTO @SeededAppointments
    (AppointmentKey, AppointmentId)
SELECT
    seed.AppointmentKey,
    appointment.AppointmentId
FROM @Appointments AS seed
INNER JOIN dbo.Appointments AS appointment
    ON appointment.DoctorId = @DoctorId
   AND appointment.AppointmentDate = CAST(@Today AS datetime2(7))
   AND appointment.StartTime = seed.StartTime;

DECLARE @Diseases table
(
    DiseaseCode nvarchar(20) NOT NULL PRIMARY KEY,
    DiseaseName nvarchar(150) NOT NULL,
    Description nvarchar(500) NULL
);

INSERT INTO @Diseases
    (DiseaseCode, DiseaseName, Description)
VALUES
    (N'I10', N'Tăng huyết áp', N'Tăng huyết áp nguyên phát hoặc theo dõi định kỳ.'),
    (N'E11', N'Đái tháo đường type 2', N'Theo dõi đường huyết và nguy cơ tim mạch.'),
    (N'I20.8', N'Đau thắt ngực ổn định khác', N'Theo dõi đau thắt ngực và nguy cơ mạch vành.');

MERGE dbo.Diseases AS target
USING @Diseases AS source
ON target.DiseaseCode = source.DiseaseCode
WHEN MATCHED THEN
    UPDATE SET
        DiseaseName = source.DiseaseName,
        Description = source.Description,
        IsActive = 1
WHEN NOT MATCHED THEN
    INSERT
        (DiseaseCode, DiseaseName, Description, IsActive, CreatedAt)
    VALUES
        (source.DiseaseCode, source.DiseaseName, source.Description, 1, @Now);

DECLARE @Records table
(
    AppointmentKey nvarchar(40) NOT NULL PRIMARY KEY,
    Symptoms nvarchar(1000) NOT NULL,
    Conclusion nvarchar(1000) NULL,
    DiseaseCode nvarchar(20) NULL,
    DiagnosisNote nvarchar(500) NULL
);

INSERT INTO @Records
    (AppointmentKey, Symptoms, Conclusion, DiseaseCode, DiagnosisNote)
VALUES
    (N'inprogress_incomplete', N'Khó thở nhẹ khi gắng sức, cần theo dõi thêm.', NULL, NULL, NULL),
    (N'inprogress_ready', N'Tái khám tăng huyết áp, huyết áp tại phòng khám còn dao động.', N'Điều chỉnh lối sống, theo dõi huyết áp tại nhà.', N'I10', N'Theo dõi định kỳ.'),
    (N'completed_no_rx', N'Đau ngực thoáng qua khi gắng sức, không khó thở khi nghỉ.', N'Tình trạng ổn định, chưa cần kê thuốc trong lượt này.', N'I20.8', N'Theo dõi triệu chứng.'),
    (N'completed_with_rx', N'Hồi hộp, tim đập nhanh khi thay đổi tư thế.', N'Tiếp tục điều trị ngoại trú và tái khám theo hẹn.', N'I10', N'Chẩn đoán chính.'),
    (N'completed_cancelled_rx', N'Khó thở nhẹ về đêm, nghe tim có âm thổi nhẹ.', N'Tình trạng ổn định, hẹn tái khám và theo dõi tại nhà.', N'E11', N'Bệnh kèm theo cần theo dõi.');

INSERT INTO dbo.MedicalRecords
    (AppointmentId, DoctorId, PatientId, PatientBookId, ExaminationDate, Symptoms, Conclusion, PaperBookUpdatedAt, CreatedAt, UpdatedAt)
SELECT
    seeded.AppointmentId,
    @DoctorId,
    NULL,
    patientBook.PatientBookId,
    @Today,
    record.Symptoms,
    record.Conclusion,
    CASE
        WHEN appointment.Status = N'Completed' THEN @Now
        ELSE NULL
    END,
    @Now,
    @Now
FROM @Records AS record
INNER JOIN @SeededAppointments AS seeded
    ON seeded.AppointmentKey = record.AppointmentKey
INNER JOIN @Appointments AS appointment
    ON appointment.AppointmentKey = record.AppointmentKey
INNER JOIN @SeededPatientBooks AS patientBook
    ON patientBook.AppointmentKey = record.AppointmentKey;

INSERT INTO dbo.RecordDiagnoses
    (MedicalRecordId, DiseaseId, IsPrimary, Note)
SELECT
    medicalRecord.MedicalRecordId,
    disease.DiseaseId,
    1,
    record.DiagnosisNote
FROM @Records AS record
INNER JOIN @SeededAppointments AS seeded
    ON seeded.AppointmentKey = record.AppointmentKey
INNER JOIN dbo.MedicalRecords AS medicalRecord
    ON medicalRecord.AppointmentId = seeded.AppointmentId
INNER JOIN dbo.Diseases AS disease
    ON disease.DiseaseCode = record.DiseaseCode
WHERE record.DiseaseCode IS NOT NULL;

DECLARE @SupplierId int;
SELECT @SupplierId = SupplierId
FROM dbo.Suppliers
WHERE SupplierName = N'Công ty Dược Demo';

IF @SupplierId IS NULL
BEGIN
    INSERT INTO dbo.Suppliers
        (SupplierName, ContactInfo, Address)
    VALUES
        (N'Công ty Dược Demo', N'0900000000', N'Kho dược thử nghiệm');

    SET @SupplierId = SCOPE_IDENTITY();
END;

DECLARE @CardioCategoryId int;
DECLARE @AntibioticCategoryId int;
DECLARE @PainCategoryId int;
DECLARE @DigestiveCategoryId int;

SELECT @CardioCategoryId = CategoryId
FROM dbo.MedicineCategories
WHERE CategoryName = N'Tim mạch';

IF @CardioCategoryId IS NULL
BEGIN
    INSERT INTO dbo.MedicineCategories (CategoryName)
    VALUES (N'Tim mạch');

    SET @CardioCategoryId = SCOPE_IDENTITY();
END;

SELECT @AntibioticCategoryId = CategoryId
FROM dbo.MedicineCategories
WHERE CategoryName = N'Kháng sinh';

IF @AntibioticCategoryId IS NULL
BEGIN
    INSERT INTO dbo.MedicineCategories (CategoryName)
    VALUES (N'Kháng sinh');

    SET @AntibioticCategoryId = SCOPE_IDENTITY();
END;

SELECT @PainCategoryId = CategoryId
FROM dbo.MedicineCategories
WHERE CategoryName = N'Giảm đau - hạ sốt';

IF @PainCategoryId IS NULL
BEGIN
    INSERT INTO dbo.MedicineCategories (CategoryName)
    VALUES (N'Giảm đau - hạ sốt');

    SET @PainCategoryId = SCOPE_IDENTITY();
END;

SELECT @DigestiveCategoryId = CategoryId
FROM dbo.MedicineCategories
WHERE CategoryName = N'Tiêu hóa';

IF @DigestiveCategoryId IS NULL
BEGIN
    INSERT INTO dbo.MedicineCategories (CategoryName)
    VALUES (N'Tiêu hóa');

    SET @DigestiveCategoryId = SCOPE_IDENTITY();
END;

DECLARE @Medicines table
(
    MedicineName nvarchar(150) NOT NULL PRIMARY KEY,
    CategoryId int NOT NULL,
    Unit nvarchar(20) NOT NULL,
    UnitPrice decimal(18, 2) NOT NULL,
    Description nvarchar(255) NULL,
    QuantityInStock int NOT NULL
);

INSERT INTO @Medicines
    (MedicineName, CategoryId, Unit, UnitPrice, Description, QuantityInStock)
VALUES
    (N'Paracetamol 500mg', @PainCategoryId, N'viên', 1200, N'Giảm đau, hạ sốt thông dụng.', 200),
    (N'Amoxicillin 500mg', @AntibioticCategoryId, N'viên', 10000, N'Kháng sinh dùng theo chỉ định.', 4),
    (N'Amlodipine 5mg', @CardioCategoryId, N'viên', 1800, N'Điều trị tăng huyết áp.', 12),
    (N'Metformin 850mg', @CardioCategoryId, N'viên', 2100, N'Thuốc dùng theo dõi đái tháo đường type 2.', 40),
    (N'Omeprazole 20mg', @DigestiveCategoryId, N'viên', 1500, N'Giảm tiết acid dạ dày.', 0);

MERGE dbo.Medicines AS target
USING
(
    SELECT
        MedicineName,
        CategoryId,
        @SupplierId AS SupplierId,
        Unit,
        UnitPrice,
        Description
    FROM @Medicines
) AS source
ON target.MedicineName = source.MedicineName
WHEN MATCHED THEN
    UPDATE SET
        CategoryId = source.CategoryId,
        SupplierId = source.SupplierId,
        Unit = source.Unit,
        UnitPrice = source.UnitPrice,
        Description = source.Description
WHEN NOT MATCHED THEN
    INSERT
        (MedicineName, CategoryId, SupplierId, Unit, UnitPrice, Description)
    VALUES
        (source.MedicineName, source.CategoryId, source.SupplierId, source.Unit, source.UnitPrice, source.Description);

MERGE dbo.Inventory AS target
USING
(
    SELECT
        medicine.MedicineId,
        N'DEMO-' + RIGHT(N'00000' + CAST(medicine.MedicineId AS nvarchar(10)), 5) AS BatchNumber,
        source.QuantityInStock,
        DATEADD(day, 365, @Today) AS ExpiryDate
    FROM @Medicines AS source
    INNER JOIN dbo.Medicines AS medicine
        ON medicine.MedicineName = source.MedicineName
) AS source
ON target.MedicineId = source.MedicineId
   AND target.BatchNumber = source.BatchNumber
   AND target.ExpiryDate = source.ExpiryDate
WHEN MATCHED THEN
    UPDATE SET QuantityInStock = source.QuantityInStock
WHEN NOT MATCHED THEN
    INSERT
        (MedicineId, BatchNumber, QuantityInStock, ExpiryDate)
    VALUES
        (source.MedicineId, source.BatchNumber, source.QuantityInStock, source.ExpiryDate);

DECLARE @PrescriptionSeeds table
(
    AppointmentKey nvarchar(40) NOT NULL PRIMARY KEY,
    Status nvarchar(20) NOT NULL,
    Notes nvarchar(1000) NULL
);

INSERT INTO @PrescriptionSeeds
    (AppointmentKey, Status, Notes)
VALUES
    (N'completed_with_rx', N'Issued', N'Uống thuốc đúng giờ, tái khám nếu hồi hộp tăng.'),
    (N'completed_cancelled_rx', N'Cancelled', N'Đơn demo đã hủy để test tái kê.');

INSERT INTO dbo.Prescriptions
    (MedicalRecordId, PrescriptionDate, Status, DispensedAt, Notes, CreatedAt, UpdatedAt)
SELECT
    medicalRecord.MedicalRecordId,
    @Now,
    seed.Status,
    NULL,
    seed.Notes,
    @Now,
    @Now
FROM @PrescriptionSeeds AS seed
INNER JOIN @SeededAppointments AS appointment
    ON appointment.AppointmentKey = seed.AppointmentKey
INNER JOIN dbo.MedicalRecords AS medicalRecord
    ON medicalRecord.AppointmentId = appointment.AppointmentId;

DECLARE @PrescriptionDetails table
(
    AppointmentKey nvarchar(40) NOT NULL,
    MedicineName nvarchar(150) NOT NULL,
    Dosage nvarchar(100) NOT NULL,
    Quantity int NOT NULL,
    Instructions nvarchar(255) NOT NULL
);

INSERT INTO @PrescriptionDetails
    (AppointmentKey, MedicineName, Dosage, Quantity, Instructions)
VALUES
    (N'completed_with_rx', N'Amoxicillin 500mg', N'Sáng 1 viên', 3, N'Uống sau ăn'),
    (N'completed_with_rx', N'Amlodipine 5mg', N'Tối 1 viên', 7, N'Uống sau ăn tối'),
    (N'completed_cancelled_rx', N'Metformin 850mg', N'Sáng 1 viên', 14, N'Uống sau ăn sáng');

INSERT INTO dbo.PrescriptionDetails
    (PrescriptionId, MedicineId, Dosage, Quantity, Instructions)
SELECT
    prescription.PrescriptionId,
    medicine.MedicineId,
    detail.Dosage,
    detail.Quantity,
    detail.Instructions
FROM @PrescriptionDetails AS detail
INNER JOIN @SeededAppointments AS appointment
    ON appointment.AppointmentKey = detail.AppointmentKey
INNER JOIN dbo.MedicalRecords AS medicalRecord
    ON medicalRecord.AppointmentId = appointment.AppointmentId
INNER JOIN dbo.Prescriptions AS prescription
    ON prescription.MedicalRecordId = medicalRecord.MedicalRecordId
INNER JOIN dbo.Medicines AS medicine
    ON medicine.MedicineName = detail.MedicineName;

SELECT
    N'Done' AS Result,
    @DoctorUsername AS DoctorUsername,
    @DoctorId AS DoctorId,
    @Today AS AppointmentDate,
    COUNT(*) AS AppointmentCount
FROM dbo.Appointments
WHERE DoctorId = @DoctorId
  AND AppointmentDate = CAST(@Today AS datetime2(7));

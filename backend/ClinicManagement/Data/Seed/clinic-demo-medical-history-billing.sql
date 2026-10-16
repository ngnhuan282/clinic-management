-- Optional, additive D6 billing fixtures for local development only.
-- Run after clinic-all-tables-demo.sql; do not run the reset seed to apply this file.
-- Existing invoices, prescriptions, clinical content and stock are never updated.
-- Paid/BHYT values are demo fixtures, not actual payments or insurance approvals.
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @cashierId int = (
        SELECT u.UserId FROM dbo.Users u
        JOIN dbo.Roles role ON role.RoleId = u.RoleId
        WHERE u.Username = 'demo_reception' AND role.RoleName = 'Receptionist'
    );
    IF @cashierId IS NULL
        THROW 51000, 'Demo receptionist not found. Apply the clinic demo seed first.', 1;

    DECLARE @targets TABLE (
        MedicalRecordId int PRIMARY KEY, Username varchar(50),
        BillingStage varchar(30), Status varchar(20), InsurancePercent decimal(18,2),
        MedicineId int NULL, Quantity int NULL, Dosage nvarchar(200), Instructions nvarchar(500)
    );
    INSERT INTO @targets VALUES
        (1001, 'demo_patient04', 'Final', 'Paid', 20, 1003, 14,
         N'Toi 1 vien', N'Uong sau an toi'),
        (1002, 'demo_patient06', 'Medicine', 'Paid', 0, 1004, 14,
         N'Toi 1 vien', N'Uong sau an'),
        (1022, 'demo_patient09', 'Final', 'Unpaid', 0, 1005, 7,
         N'Sang 1 vien', N'Uong truoc bua sang 30 phut');

    -- Include the user's completed demo visit only when an issued prescription exists.
    INSERT INTO @targets
    SELECT r.MedicalRecordId, u.Username, 'Final', 'Unpaid', 0, NULL, NULL, NULL, NULL
    FROM dbo.MedicalRecords r
    JOIN dbo.Appointments a ON a.AppointmentId = r.AppointmentId
    JOIN dbo.Users u ON u.UserId = a.PatientId
    JOIN dbo.Prescriptions rx ON rx.MedicalRecordId = r.MedicalRecordId
    WHERE a.AppointmentId = 1025 AND a.Status = 'Completed'
      AND u.Username = 'demo_patient06' AND rx.Status = 'Issued';

    DECLARE @recordId int, @username varchar(50), @stage varchar(30), @status varchar(20),
            @insurancePercent decimal(18,2), @medicineId int, @quantity int,
            @dosage nvarchar(200), @instructions nvarchar(500);
    DECLARE @added TABLE (MedicalRecordId int, PrescriptionId int, InvoiceId int, Status varchar(20));
    DECLARE billing_targets CURSOR LOCAL FAST_FORWARD FOR
        SELECT MedicalRecordId, Username, BillingStage, Status, InsurancePercent,
               MedicineId, Quantity, Dosage, Instructions
        FROM @targets ORDER BY MedicalRecordId;
    OPEN billing_targets;
    FETCH NEXT FROM billing_targets INTO @recordId, @username, @stage, @status,
        @insurancePercent, @medicineId, @quantity, @dosage, @instructions;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        DECLARE @appointmentId int = NULL, @patientId int = NULL, @invoiceAt datetime2 = NULL,
                @prescriptionId int = NULL, @prescriptionStatus varchar(20) = NULL;
        SELECT @appointmentId = a.AppointmentId, @patientId = u.UserId,
               @invoiceAt = DATEADD(minute, DATEDIFF(minute, CAST('00:00' AS time), a.EndTime),
                                    CAST(a.AppointmentDate AS datetime2))
        FROM dbo.MedicalRecords r
        JOIN dbo.Appointments a ON a.AppointmentId = r.AppointmentId
        JOIN dbo.Users u ON u.UserId = a.PatientId
        JOIN dbo.Roles role ON role.RoleId = u.RoleId
        JOIN dbo.Patients p ON p.UserId = u.UserId
        WHERE r.MedicalRecordId = @recordId AND u.Username = @username
          AND role.RoleName = 'Patient' AND a.Status = 'Completed'
          AND (a.PatientProfileId IS NULL OR a.PatientProfileId = p.PatientId);

        IF @appointmentId IS NOT NULL
        BEGIN
            SELECT @prescriptionId = PrescriptionId, @prescriptionStatus = Status
            FROM dbo.Prescriptions WHERE MedicalRecordId = @recordId;

            IF @prescriptionId IS NULL AND @medicineId IS NOT NULL
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM dbo.Medicines WHERE MedicineId = @medicineId)
                    THROW 51000, 'A required demo medicine is missing. No fixture data was applied.', 1;
                INSERT INTO dbo.Prescriptions
                    (MedicalRecordId, PrescriptionDate, Status, Notes, CreatedAt, UpdatedAt)
                VALUES (@recordId, @invoiceAt, 'Issued',
                        N'Don thuoc demo D6 de xem lich su va chi phi.', @invoiceAt, @invoiceAt);
                SET @prescriptionId = CONVERT(int, SCOPE_IDENTITY());
                SET @prescriptionStatus = 'Issued';
                INSERT INTO dbo.PrescriptionDetails
                    (PrescriptionId, MedicineId, Quantity, Dosage, Instructions)
                VALUES (@prescriptionId, @medicineId, @quantity, @dosage, @instructions);
            END;

            IF @prescriptionStatus IN ('Issued', 'Dispensed')
               AND NOT (@status = 'Unpaid' AND @prescriptionStatus = 'Dispensed')
               AND EXISTS (SELECT 1 FROM dbo.PrescriptionDetails WHERE PrescriptionId = @prescriptionId)
               AND NOT EXISTS (
                   SELECT 1 FROM dbo.Invoices i
                   JOIN dbo.InvoiceDetails line ON line.InvoiceId = i.Id
                   WHERE i.AppointmentId = @appointmentId AND i.PatientId = @patientId
                     AND i.BillingStage IN ('Medicine', 'Final')
                     AND ((line.SourceType = 'Prescription' AND line.SourceId = @prescriptionId)
                          OR (line.SourceType = 'PrescriptionDetail' AND EXISTS (
                              SELECT 1 FROM dbo.PrescriptionDetails pd
                              WHERE pd.PrescriptionId = @prescriptionId AND pd.PrescriptionDetailId = line.SourceId)))
               )
            BEGIN
                DECLARE @medicineAmount decimal(18,2), @totalAmount decimal(18,2),
                        @insuranceAmount decimal(18,2), @invoiceId int;
                SELECT @medicineAmount = SUM(m.UnitPrice * pd.Quantity)
                FROM dbo.PrescriptionDetails pd
                JOIN dbo.Medicines m ON m.MedicineId = pd.MedicineId
                WHERE pd.PrescriptionId = @prescriptionId;
                SET @totalAmount = @medicineAmount + CASE WHEN @stage = 'Final' THEN 100000 ELSE 0 END;
                SET @insuranceAmount = ROUND(@totalAmount * @insurancePercent / 100, 2);
                INSERT INTO dbo.Invoices
                    (AppointmentId, PatientId, CashierId, BillingStage, TotalAmount,
                     InsuranceDiscountPercent, InsuranceAmount, PatientAmount, PaymentMethod, Status, CreatedAt)
                VALUES (@appointmentId, @patientId, @cashierId, @stage, @totalAmount,
                        @insurancePercent, @insuranceAmount, @totalAmount - @insuranceAmount,
                        'Cash', @status, @invoiceAt);
                SET @invoiceId = CONVERT(int, SCOPE_IDENTITY());
                INSERT INTO dbo.InvoiceDetails
                    (InvoiceId, SourceType, SourceId, ItemName, UnitPrice, Quantity, TotalPrice)
                SELECT @invoiceId, 'PrescriptionDetail', pd.PrescriptionDetailId,
                       m.MedicineName, m.UnitPrice, pd.Quantity, m.UnitPrice * pd.Quantity
                FROM dbo.PrescriptionDetails pd
                JOIN dbo.Medicines m ON m.MedicineId = pd.MedicineId
                WHERE pd.PrescriptionId = @prescriptionId;
                IF @stage = 'Final'
                    INSERT INTO dbo.InvoiceDetails
                        (InvoiceId, SourceType, SourceId, ItemName, UnitPrice, Quantity, TotalPrice)
                    VALUES (@invoiceId, 'Appointment', @appointmentId, N'Phi kham (DEMO D6)', 100000, 1, 100000);
                INSERT INTO @added VALUES (@recordId, @prescriptionId, @invoiceId, @status);
            END;
        END;
        FETCH NEXT FROM billing_targets INTO @recordId, @username, @stage, @status,
            @insurancePercent, @medicineId, @quantity, @dosage, @instructions;
    END;
    CLOSE billing_targets;
    DEALLOCATE billing_targets;
    COMMIT TRANSACTION;

    SELECT 'Added demo billing fixtures' AS Result, COUNT(*) AS AddedInvoices FROM @added;
    SELECT u.Username, r.MedicalRecordId, rx.PrescriptionId, i.Id AS InvoiceId,
           i.BillingStage, i.Status, i.TotalAmount, i.InsuranceAmount, i.PatientAmount
    FROM @targets target
    JOIN dbo.MedicalRecords r ON r.MedicalRecordId = target.MedicalRecordId
    JOIN dbo.Appointments a ON a.AppointmentId = r.AppointmentId
    JOIN dbo.Users u ON u.UserId = a.PatientId AND u.Username = target.Username
    JOIN dbo.Prescriptions rx ON rx.MedicalRecordId = r.MedicalRecordId
    JOIN dbo.InvoiceDetails line ON (line.SourceType = 'Prescription' AND line.SourceId = rx.PrescriptionId)
        OR (line.SourceType = 'PrescriptionDetail' AND EXISTS (
            SELECT 1 FROM dbo.PrescriptionDetails pd
            WHERE pd.PrescriptionId = rx.PrescriptionId AND pd.PrescriptionDetailId = line.SourceId))
    JOIN dbo.Invoices i ON i.Id = line.InvoiceId AND i.AppointmentId = a.AppointmentId AND i.PatientId = u.UserId
    GROUP BY u.Username, r.MedicalRecordId, rx.PrescriptionId, i.Id,
             i.BillingStage, i.Status, i.TotalAmount, i.InsuranceAmount, i.PatientAmount
    ORDER BY r.MedicalRecordId;
END TRY
BEGIN CATCH
    IF CURSOR_STATUS('local', 'billing_targets') >= 0 CLOSE billing_targets;
    IF CURSOR_STATUS('local', 'billing_targets') > -3 DEALLOCATE billing_targets;
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

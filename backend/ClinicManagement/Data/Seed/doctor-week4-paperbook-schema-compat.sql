-- AddPatientBooksAndPaperBookTracking and AddReceptionCheckInBooks both
-- introduced PatientBooks. Complete paper-book tracking on databases where
-- reception has already been applied, preserving its Patients foreign key,
-- required patient IDs, invoices, constraints, and existing books.
-- Apply AddPrescriptions and AddDoctorScheduleStatus with their EF scripts.
SET XACT_ABORT ON;

BEGIN TRY
BEGIN TRANSACTION;

IF NOT EXISTS
(
    SELECT 1 FROM dbo.__EFMigrationsHistory
    WHERE MigrationId = N'20260928063651_AddReceptionCheckInBooks'
)
    THROW 51002, N'This compatibility upgrade requires AddReceptionCheckInBooks.', 1;

IF COL_LENGTH(N'dbo.PatientBooks', N'BookInvoiceId') IS NULL
    THROW 51003, N'The reception PatientBooks schema was not found.', 1;

IF COL_LENGTH(N'dbo.PatientBooks', N'PreviousBookId') IS NULL
    ALTER TABLE dbo.PatientBooks ADD PreviousBookId int NULL;

IF COL_LENGTH(N'dbo.PatientBooks', N'CreatedAt') IS NULL
    ALTER TABLE dbo.PatientBooks ADD CreatedAt datetime2 NOT NULL
        CONSTRAINT DF_PatientBooks_CreatedAt DEFAULT (GETDATE()) WITH VALUES;

IF COL_LENGTH(N'dbo.PatientBooks', N'UpdatedAt') IS NULL
    ALTER TABLE dbo.PatientBooks ADD UpdatedAt datetime2 NOT NULL
        CONSTRAINT DF_PatientBooks_UpdatedAt DEFAULT (GETDATE()) WITH VALUES;

IF COL_LENGTH(N'dbo.MedicalRecords', N'PatientBookId') IS NULL
    ALTER TABLE dbo.MedicalRecords ADD PatientBookId int NULL;

IF COL_LENGTH(N'dbo.MedicalRecords', N'PaperBookUpdatedAt') IS NULL
    ALTER TABLE dbo.MedicalRecords ADD PaperBookUpdatedAt datetime2 NULL;

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.PatientBooks') AND name = N'IX_PatientBooks_PreviousBookId'
)
    EXEC(N'CREATE INDEX IX_PatientBooks_PreviousBookId ON dbo.PatientBooks (PreviousBookId);');

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.MedicalRecords') AND name = N'IX_MedicalRecords_PatientBookId'
)
    EXEC(N'CREATE INDEX IX_MedicalRecords_PatientBookId ON dbo.MedicalRecords (PatientBookId);');

IF OBJECT_ID(N'dbo.FK_PatientBooks_PatientBooks_PreviousBookId', N'F') IS NULL
    EXEC(N'ALTER TABLE dbo.PatientBooks ADD CONSTRAINT FK_PatientBooks_PatientBooks_PreviousBookId
        FOREIGN KEY (PreviousBookId) REFERENCES dbo.PatientBooks (PatientBookId);');

IF OBJECT_ID(N'dbo.FK_MedicalRecords_PatientBooks_PatientBookId', N'F') IS NULL
    EXEC(N'ALTER TABLE dbo.MedicalRecords ADD CONSTRAINT FK_MedicalRecords_PatientBooks_PatientBookId
        FOREIGN KEY (PatientBookId) REFERENCES dbo.PatientBooks (PatientBookId);');

-- The shared Appointments columns, indexes, and book FK are already supplied
-- by reception. Record the completed tracking upgrade only after adding its
-- remaining columns, indexes, and FKs above.
IF NOT EXISTS
(
    SELECT 1 FROM dbo.__EFMigrationsHistory
    WHERE MigrationId = N'20260927112000_AddPatientBooksAndPaperBookTracking'
)
    INSERT INTO dbo.__EFMigrationsHistory (MigrationId, ProductVersion)
    VALUES (N'20260927112000_AddPatientBooksAndPaperBookTracking', N'8.0.10');

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @Today DATE = CAST(GETDATE() AS DATE);
    DECLARE @DoctorId INT = (
        SELECT TOP 1 DoctorId
        FROM Doctors
        WHERE IsActive = 1
        ORDER BY DoctorId
    );

    IF @DoctorId IS NULL
    BEGIN
        THROW 51000, N'Cần tạo dữ liệu bác sĩ trước khi seed lịch khám mẫu.', 1;
    END;

    INSERT INTO Diseases (
        DiseaseCode,
        DiseaseName,
        Description,
        IsActive,
        CreatedAt
    )
    SELECT
        N'J45',
        N'Hen phế quản',
        N'Bệnh hen và khó thở tái phát',
        1,
        GETDATE()
    WHERE NOT EXISTS (
        SELECT 1 FROM Diseases
        WHERE DiseaseCode = N'J45'
            OR DiseaseName = N'Hen phế quản'
    );

    INSERT INTO Diseases (
        DiseaseCode,
        DiseaseName,
        Description,
        IsActive,
        CreatedAt
    )
    SELECT
        N'K29',
        N'Viêm dạ dày',
        N'Đau thượng vị, khó tiêu hoặc buồn nôn',
        1,
        GETDATE()
    WHERE NOT EXISTS (
        SELECT 1 FROM Diseases
        WHERE DiseaseCode = N'K29'
            OR DiseaseName = N'Viêm dạ dày'
    );

    INSERT INTO Diseases (
        DiseaseCode,
        DiseaseName,
        Description,
        IsActive,
        CreatedAt
    )
    SELECT
        N'R07',
        N'Đau ngực',
        N'Triệu chứng đau hoặc tức ngực cần đánh giá lâm sàng',
        1,
        GETDATE()
    WHERE NOT EXISTS (
        SELECT 1 FROM Diseases
        WHERE DiseaseCode = N'R07'
            OR DiseaseName = N'Đau ngực'
    );

    INSERT INTO Appointments (
        DoctorId,
        PatientId,
        PatientName,
        PatientPhone,
        AppointmentDate,
        StartTime,
        EndTime,
        Reason,
        Status,
        CreatedAt
    )
    SELECT
        @DoctorId,
        NULL,
        N'Nguyễn Văn An',
        N'0912834721',
        @Today,
        CAST('09:30:00' AS TIME),
        CAST('09:45:00' AS TIME),
        N'Đau thắt ngực khi gắng sức, hồi hộp khó thở 2 ngày',
        N'InProgress',
        GETDATE()
    WHERE NOT EXISTS (
        SELECT 1 FROM Appointments
        WHERE AppointmentDate = @Today
            AND PatientPhone = N'0912834721'
    )
        AND NOT EXISTS (
            SELECT 1 FROM Appointments
            WHERE DoctorId = @DoctorId
                AND AppointmentDate = @Today
                AND StartTime = CAST('09:30:00' AS TIME)
                AND Status <> N'Cancelled'
        );

    INSERT INTO Appointments (
        DoctorId,
        PatientId,
        PatientName,
        PatientPhone,
        AppointmentDate,
        StartTime,
        EndTime,
        Reason,
        Status,
        CreatedAt
    )
    SELECT
        @DoctorId,
        NULL,
        N'Trần Thị Bích',
        N'0903567891',
        @Today,
        CAST('09:45:00' AS TIME),
        CAST('10:00:00' AS TIME),
        N'Tái khám tăng huyết áp định kỳ, cần đo lại HA và chỉnh liều thuốc',
        N'Pending',
        GETDATE()
    WHERE NOT EXISTS (
        SELECT 1 FROM Appointments
        WHERE AppointmentDate = @Today
            AND PatientPhone = N'0903567891'
    )
        AND NOT EXISTS (
            SELECT 1 FROM Appointments
            WHERE DoctorId = @DoctorId
                AND AppointmentDate = @Today
                AND StartTime = CAST('09:45:00' AS TIME)
                AND Status <> N'Cancelled'
        );

    INSERT INTO Appointments (
        DoctorId,
        PatientId,
        PatientName,
        PatientPhone,
        AppointmentDate,
        StartTime,
        EndTime,
        Reason,
        Status,
        CreatedAt
    )
    SELECT
        @DoctorId,
        NULL,
        N'Lê Hoàng Nam',
        N'0988112233',
        @Today,
        CAST('10:00:00' AS TIME),
        CAST('10:15:00' AS TIME),
        N'Cơn đau ngực lan vai trái, vã mồ hôi, tiền sử xơ vữa mạch vành',
        N'Confirmed',
        GETDATE()
    WHERE NOT EXISTS (
        SELECT 1 FROM Appointments
        WHERE AppointmentDate = @Today
            AND PatientPhone = N'0988112233'
    )
        AND NOT EXISTS (
            SELECT 1 FROM Appointments
            WHERE DoctorId = @DoctorId
                AND AppointmentDate = @Today
                AND StartTime = CAST('10:00:00' AS TIME)
                AND Status <> N'Cancelled'
        );

    INSERT INTO Appointments (
        DoctorId,
        PatientId,
        PatientName,
        PatientPhone,
        AppointmentDate,
        StartTime,
        EndTime,
        Reason,
        Status,
        CreatedAt
    )
    SELECT
        @DoctorId,
        NULL,
        N'Phạm Thị Mai',
        N'0974332115',
        @Today,
        CAST('10:15:00' AS TIME),
        CAST('10:30:00' AS TIME),
        N'Hồi hộp, tim đập nhanh kèm chóng mặt khi đứng dậy đột ngột',
        N'Pending',
        GETDATE()
    WHERE NOT EXISTS (
        SELECT 1 FROM Appointments
        WHERE AppointmentDate = @Today
            AND PatientPhone = N'0974332115'
    )
        AND NOT EXISTS (
            SELECT 1 FROM Appointments
            WHERE DoctorId = @DoctorId
                AND AppointmentDate = @Today
                AND StartTime = CAST('10:15:00' AS TIME)
                AND Status <> N'Cancelled'
        );

    INSERT INTO Appointments (
        DoctorId,
        PatientId,
        PatientName,
        PatientPhone,
        AppointmentDate,
        StartTime,
        EndTime,
        Reason,
        Status,
        CreatedAt
    )
    SELECT
        @DoctorId,
        NULL,
        N'Đỗ Quốc Huy',
        N'0935221789',
        @Today,
        CAST('08:50:00' AS TIME),
        CAST('09:05:00' AS TIME),
        N'Khám sức khỏe tim mạch, theo dõi đái tháo đường type 2',
        N'Completed',
        GETDATE()
    WHERE NOT EXISTS (
        SELECT 1 FROM Appointments
        WHERE AppointmentDate = @Today
            AND PatientPhone = N'0935221789'
    )
        AND NOT EXISTS (
            SELECT 1 FROM Appointments
            WHERE DoctorId = @DoctorId
                AND AppointmentDate = @Today
                AND StartTime = CAST('08:50:00' AS TIME)
                AND Status <> N'Cancelled'
        );

    INSERT INTO Appointments (
        DoctorId,
        PatientId,
        PatientName,
        PatientPhone,
        AppointmentDate,
        StartTime,
        EndTime,
        Reason,
        Status,
        CreatedAt
    )
    SELECT
        @DoctorId,
        NULL,
        N'Hoàng Thị Lan',
        N'0918445670',
        @Today,
        CAST('13:30:00' AS TIME),
        CAST('13:45:00' AS TIME),
        N'Khó thở nhẹ về đêm, khám sàng lọc van tim',
        N'Completed',
        GETDATE()
    WHERE NOT EXISTS (
        SELECT 1 FROM Appointments
        WHERE AppointmentDate = @Today
            AND PatientPhone = N'0918445670'
    )
        AND NOT EXISTS (
            SELECT 1 FROM Appointments
            WHERE DoctorId = @DoctorId
                AND AppointmentDate = @Today
                AND StartTime = CAST('13:30:00' AS TIME)
                AND Status <> N'Cancelled'
        );

    DECLARE @E11Id INT = (
        SELECT TOP 1 DiseaseId
        FROM Diseases
        WHERE DiseaseCode = N'E11'
            OR DiseaseName = N'Dai thao duong type 2'
            OR DiseaseName = N'Đái tháo đường type 2'
    );
    DECLARE @J45Id INT = (
        SELECT TOP 1 DiseaseId
        FROM Diseases
        WHERE DiseaseCode = N'J45'
            OR DiseaseName = N'Hen phế quản'
    );
    DECLARE @CompletedMorningAppointmentId INT = (
        SELECT TOP 1 AppointmentId
        FROM Appointments
        WHERE AppointmentDate = @Today
            AND PatientPhone = N'0935221789'
    );
    DECLARE @CompletedAfternoonAppointmentId INT = (
        SELECT TOP 1 AppointmentId
        FROM Appointments
        WHERE AppointmentDate = @Today
            AND PatientPhone = N'0918445670'
    );

    IF @CompletedMorningAppointmentId IS NOT NULL
        AND @E11Id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM MedicalRecords
            WHERE AppointmentId = @CompletedMorningAppointmentId
        )
    BEGIN
        INSERT INTO MedicalRecords (
            AppointmentId,
            DoctorId,
            PatientId,
            ExaminationDate,
            Symptoms,
            Conclusion,
            CreatedAt,
            UpdatedAt
        )
        SELECT
            @CompletedMorningAppointmentId,
            @DoctorId,
            NULL,
            @Today,
            N'Khám sức khỏe tim mạch, theo dõi đường huyết và huyết áp.',
            N'Tình trạng ổn định, hẹn tái khám và tiếp tục theo dõi tại nhà.',
            GETDATE(),
            GETDATE();

        INSERT INTO RecordDiagnoses (
            MedicalRecordId,
            DiseaseId,
            IsPrimary,
            Note
        )
        SELECT
            SCOPE_IDENTITY(),
            @E11Id,
            1,
            N'Theo dõi định kỳ'
        WHERE NOT EXISTS (
            SELECT 1
            FROM RecordDiagnoses rd
            INNER JOIN MedicalRecords mr
                ON mr.MedicalRecordId = rd.MedicalRecordId
            WHERE mr.AppointmentId = @CompletedMorningAppointmentId
                AND rd.DiseaseId = @E11Id
        );
    END;

    IF @CompletedAfternoonAppointmentId IS NOT NULL
        AND @J45Id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM MedicalRecords
            WHERE AppointmentId = @CompletedAfternoonAppointmentId
        )
    BEGIN
        INSERT INTO MedicalRecords (
            AppointmentId,
            DoctorId,
            PatientId,
            ExaminationDate,
            Symptoms,
            Conclusion,
            CreatedAt,
            UpdatedAt
        )
        SELECT
            @CompletedAfternoonAppointmentId,
            @DoctorId,
            NULL,
            @Today,
            N'Khó thở nhẹ về đêm, nghe phổi thông khí giảm nhẹ.',
            N'Tư vấn theo dõi triệu chứng hô hấp, tái khám khi khó thở tăng.',
            GETDATE(),
            GETDATE();

        INSERT INTO RecordDiagnoses (
            MedicalRecordId,
            DiseaseId,
            IsPrimary,
            Note
        )
        SELECT
            SCOPE_IDENTITY(),
            @J45Id,
            1,
            N'Cần theo dõi triệu chứng về đêm'
        WHERE NOT EXISTS (
            SELECT 1
            FROM RecordDiagnoses rd
            INNER JOIN MedicalRecords mr
                ON mr.MedicalRecordId = rd.MedicalRecordId
            WHERE mr.AppointmentId = @CompletedAfternoonAppointmentId
                AND rd.DiseaseId = @J45Id
        );
    END;

    COMMIT TRANSACTION;

    SELECT
        @Today AS SeedDate,
        (
            SELECT COUNT(*)
            FROM Appointments
            WHERE AppointmentDate = @Today
                AND Status <> N'Cancelled'
        ) AS TotalAppointmentsToday,
        (
            SELECT COUNT(*)
            FROM MedicalRecords mr
            INNER JOIN Appointments ap
                ON ap.AppointmentId = mr.AppointmentId
            WHERE ap.AppointmentDate = @Today
        ) AS TotalMedicalRecordsToday,
        (
            SELECT COUNT(*)
            FROM Diseases
        ) AS TotalDiseases;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;

using ClinicManagement.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

internal static class MigrationChecks
{
    public static async Task RunAsync(ApplicationDbContext source, Action<bool, string> check)
    {
        var connection = new SqlConnectionStringBuilder(source.Database.GetDbConnection().ConnectionString)
        {
            InitialCatalog = "ClinicMigrationTest_" + Guid.NewGuid().ToString("N")
        };
        await using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(connection.ConnectionString).Options);
        var migrator = db.GetService<IMigrator>();
        const string review = "20260927151138_AddScheduleReview";
        try
        {
            await migrator.MigrateAsync("20260927030547_GrantDoctorPharmacyViewCatalog");
            await db.Database.ExecuteSqlRawAsync(@"
SET IDENTITY_INSERT Roles ON;
INSERT INTO Roles (RoleId, RoleName, Description, IsSystem)
VALUES (6, 'CustomRole', 'Keep custom role', 0), (42, 'DepartmentHead', 'Existing head', 0);
SET IDENTITY_INSERT Roles OFF;
SET IDENTITY_INSERT Users ON;
INSERT INTO Users (UserId, Username, PasswordHash, FullName, Phone, RoleId, Status, SecurityVersion)
VALUES (9001, 'migration_patient', 'unused-fixture-hash', 'Legacy patient', '0901234567', 4, 1, 0),
       (9002, 'migration_head', 'unused-fixture-hash', 'Legacy head', NULL, 42, 1, 0);
SET IDENTITY_INSERT Users OFF;
UPDATE Doctors SET UserId = 9002 WHERE DoctorId = 1;
INSERT INTO DoctorSchedules (ScheduleId, DoctorId, RoomId, WorkDate, Shift, MaxPatients, IsActive)
VALUES ('00000000-0000-0000-0000-000000000001', 1, 1, '2026-10-05', 'Morning', 4, 1);
INSERT INTO TimeSlots (SlotId, ScheduleId, StartTime, EndTime, MaxCapacity, CurrentBooked, IsAvailable)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
        '08:00', '08:30', 4, 1, 1);
SET IDENTITY_INSERT Appointments ON;
INSERT INTO Appointments (AppointmentId, DoctorId, PatientId, PatientName, PatientPhone,
                          AppointmentDate, StartTime, EndTime, Reason, Status)
VALUES (9001, 1, 9001, 'Legacy patient', '0901234567', '2026-10-05', '08:00', '08:30', 'Follow-up', 'InProgress');
SET IDENTITY_INSERT Appointments OFF;
SET IDENTITY_INSERT MedicalRecords ON;
INSERT INTO MedicalRecords (MedicalRecordId, AppointmentId, DoctorId, PatientId, ExaminationDate, Symptoms)
VALUES (9001, 9001, 1, 9001, '2026-10-05', 'Legacy symptoms');
SET IDENTITY_INSERT MedicalRecords OFF;
");
            await migrator.MigrateAsync(review);
            await db.Database.ExecuteSqlRawAsync(@"
SET IDENTITY_INSERT PatientBooks ON;
INSERT INTO PatientBooks (PatientBookId, PatientId, BookNumber, Status, PreviousBookId, IssuedAt, CreatedAt)
VALUES (9001, 9001, 'LEGACY-01', 'Voided', NULL, '2026-09-01', '2026-09-01'),
       (9002, 9001, 'LEGACY-02', 'Issued', 9001, NULL, '2026-10-01'),
       (9003, NULL, NULL, 'Issued', NULL, NULL, '2026-10-01');
SET IDENTITY_INSERT PatientBooks OFF;
UPDATE Appointments SET PatientBookId = 9002, BookVerifiedAt = '2026-10-05T08:00:00' WHERE AppointmentId = 9001;
UPDATE MedicalRecords SET PatientBookId = 9002, PaperBookUpdatedAt = '2026-10-05T08:15:00' WHERE MedicalRecordId = 9001;
");
            try
            {
                await db.Database.MigrateAsync();
                throw new Exception("Invalid legacy book should stop the upgrade");
            }
            catch (SqlException e) when (e.Number == 51000)
            {
                check(!((await db.Database.GetAppliedMigrationsAsync()).Contains("20260928063651_AddReceptionCheckInBooks")),
                    "Invalid legacy books stop the upgrade without committing reception schema");
                check(await CountAsync(db, "SELECT COUNT(*) AS Value FROM PatientBooks") == 3,
                    "Rejected upgrade preserves all legacy books");
            }
            await db.Database.ExecuteSqlRawAsync("DELETE FROM PatientBooks WHERE PatientBookId = 9003");
            await db.Database.MigrateAsync();
            await VerifyPreservedAsync(db, check);
            check(!((await db.Database.GetPendingMigrationsAsync()).Any()), "Populated legacy database upgrades through every migration");
            await db.Database.MigrateAsync();
            check(await db.DoctorScheduleRequests.CountAsync() == 1 && await db.PatientBooks.CountAsync() == 2,
                "Repeated migration update does not duplicate requests or books");

            await migrator.MigrateAsync(review);
            check(await CountAsync(db, "SELECT COUNT(*) AS Value FROM PatientBooks WHERE PatientBookId IN (9001,9002)") == 2
                && await CountAsync(db, "SELECT COUNT(*) AS Value FROM Appointments WHERE PatientBookId = 9002") == 1,
                "Downgrade keeps paper-book table, IDs and appointment references");
            check(await CountAsync(db, "SELECT COUNT(*) AS Value FROM Departments") == 3
                && await CountAsync(db, "SELECT COUNT(*) AS Value FROM Users WHERE UserId IN (9001,9002)") == 2,
                "Removing the snapshot marker keeps existing catalog and accounts");
            await db.Database.MigrateAsync();
            await VerifyPreservedAsync(db, check);
        }
        finally
        {
            await db.Database.EnsureDeletedAsync();
        }
    }

    private static async Task VerifyPreservedAsync(ApplicationDbContext db, Action<bool, string> check)
    {
        db.ChangeTracker.Clear();
        var head = await db.Users.Include(x => x.Role).SingleAsync(x => x.UserId == 9002);
        check(head.RoleId == 42 && head.Role.IsSystem
            && await db.Roles.AnyAsync(x => x.RoleId == 6 && x.RoleName == "CustomRole")
            && await db.Doctors.AnyAsync(x => x.DoctorId == 1 && x.UserId == head.UserId)
            && await db.RolePermissions.AnyAsync(x => x.RoleId == 42 && x.PermissionCode == "schedules.review"),
            "Existing DepartmentHead account, custom role, doctor linkage and review permissions survive");
        var book = await db.PatientBooks.Include(x => x.Patient).SingleAsync(x => x.PatientBookId == 9002);
        check(book.PreviousBookId == 9001 && book.BookNumber == "LEGACY-02" && book.PatientId == 9001
            && book.Patient.FullName == "Legacy patient" && book.Patient.Phone == "0901234567"
            && book.IssuedAt == new DateTime(2026, 10, 1),
            "Existing books keep owner identity, history, number and issue date");
        var appointment = await db.Appointments.SingleAsync(x => x.AppointmentId == 9001);
        var record = await db.MedicalRecords.SingleAsync(x => x.MedicalRecordId == 9001);
        check(appointment.PatientBookId == 9002 && appointment.PatientProfileId == 9001
            && appointment.CheckedInAt == appointment.BookVerifiedAt && appointment.Status == "InProgress"
            && record.PatientBookId == 9002 && record.Symptoms == "Legacy symptoms"
            && record.PaperBookUpdatedAt == new DateTime(2026, 10, 5, 8, 15, 0),
            "Check-in, clinical record and paper-book verification survive upgrading");
        var schedule = await db.DoctorSchedules.Include(x => x.Request).Include(x => x.TimeSlots).SingleAsync();
        check(schedule.ScheduleId == Guid.Parse("00000000-0000-0000-0000-000000000001")
            && schedule.Status == "Approved" && schedule.StartTime == TimeSpan.FromHours(8)
            && schedule.EndTime == TimeSpan.FromHours(8.5) && schedule.Request?.Status == "Approved"
            && schedule.TimeSlots.Single().CurrentBooked == 1,
            "Legacy approved schedule keeps its ID, times, approved request and booked slots");
    }

    private static Task<int> CountAsync(ApplicationDbContext db, string sql) =>
        db.Database.SqlQueryRaw<int>(sql).SingleAsync();
}

using ClinicManagement.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

internal static class BillingMigrationChecks
{
    public static async Task RunAsync(ApplicationDbContext source, Action<bool, string> check)
    {
        var connection = new SqlConnectionStringBuilder(source.Database.GetDbConnection().ConnectionString)
        {
            InitialCatalog = "ClinicBillingMigrationTest_" + Guid.NewGuid().ToString("N")
        };
        await using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(connection.ConnectionString).Options);
        var migrator = db.GetService<IMigrator>();
        const string previous = "20261013024927_SeedDepartmentHeadRole";
        try
        {
            await migrator.MigrateAsync(previous);
            await db.Database.ExecuteSqlRawAsync(@"
INSERT INTO Invoices (AppointmentId, PatientId, CashierId, BillingStage, TotalAmount,
    InsuranceDiscountPercent, InsuranceAmount, PatientAmount, PaymentMethod, Status, CreatedAt)
VALUES (NULL, 1, 1, 'Pending', 125000, 80.25, 100312.50, 24687.50, 'Cash', 'Paid', '2026-10-10');");

            async Task VerifyMoneyAsync() => check(await db.Database.SqlQueryRaw<int>(@"
SELECT COUNT(*) AS Value FROM Invoices WHERE AppointmentId IS NULL AND TotalAmount = 125000
AND InsuranceDiscountPercent = 80.25 AND InsuranceAmount = 100312.50 AND PatientAmount = 24687.50")
                .SingleAsync() == 1, "Invoice upgrade/downgrade preserves nullable appointments and existing insurance amounts");

            await db.Database.MigrateAsync();
            await VerifyMoneyAsync();
            check(await db.Database.SqlQueryRaw<int>("SELECT COUNT(*) AS Value FROM Invoices WHERE InvoiceType = 'Standard' AND OriginalInvoiceId IS NULL").SingleAsync() == 1,
                "Invoice migration backfills Standard type for existing invoices");
            check(await db.Database.SqlQueryRaw<int>("SELECT COUNT(*) AS Value FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Invoices') AND name = N'InsuranceDiscountPercent' AND precision = 5 AND scale = 2").SingleAsync() == 1,
                "Invoice insurance percentage uses the model's decimal(5,2) precision");
            await db.Database.MigrateAsync();
            await VerifyMoneyAsync();

            await migrator.MigrateAsync(previous);
            await VerifyMoneyAsync();
            check(await db.Database.SqlQueryRaw<int>("SELECT COUNT(*) AS Value FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Invoices') AND name IN (N'InsuranceAmount', N'InsuranceDiscountPercent', N'PatientAmount')").SingleAsync() == 3,
                "Invoice rollback keeps all insurance columns owned by earlier migrations");
            await db.Database.MigrateAsync();
            await VerifyMoneyAsync();
        }
        finally
        {
            await db.Database.EnsureDeletedAsync();
        }
    }
}

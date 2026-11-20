using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ClinicManagement.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261120010000_RepairInvoicePayments")]
public sealed class RepairInvoicePayments : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // The merged payment migration has an empty Up; repair databases that already applied it too.
        migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.InvoicePayments', N'CashierId') IS NULL
    ALTER TABLE [dbo].[InvoicePayments] ADD [CashierId] int NOT NULL DEFAULT 0;
IF COL_LENGTH(N'dbo.InvoicePayments', N'PaidAt') IS NULL
    ALTER TABLE [dbo].[InvoicePayments] ADD [PaidAt] datetime2 NOT NULL DEFAULT (GETUTCDATE());

EXEC(N'UPDATE p SET CashierId = i.CashierId, PaidAt = p.CreatedAt
FROM [dbo].[InvoicePayments] p JOIN [dbo].[Invoices] i ON i.Id = p.InvoiceId
WHERE p.CashierId = 0;');

UPDATE i SET PaidAmount = PatientAmount
FROM [dbo].[Invoices] i
WHERE i.Status = 'Paid' AND i.PaidAmount = 0 AND i.PatientAmount <> 0
AND NOT EXISTS (SELECT 1 FROM [dbo].[InvoicePayments] p WHERE p.InvoiceId = i.Id);

UPDATE i SET PaidAmount = PatientAmount
FROM [dbo].[Invoices] i
WHERE i.Status = 'Refunded' AND i.InvoiceType = 'Adjustment' AND i.PaidAmount = 0
AND NOT EXISTS (SELECT 1 FROM [dbo].[InvoicePayments] p WHERE p.InvoiceId = i.Id);
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "PaidAt", table: "InvoicePayments");
        migrationBuilder.DropColumn(name: "CashierId", table: "InvoicePayments");
    }
}

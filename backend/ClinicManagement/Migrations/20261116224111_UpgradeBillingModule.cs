using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations
{
    public partial class UpgradeBillingModule : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.Invoices', N'PaidAmount') IS NULL
BEGIN
    ALTER TABLE [dbo].[Invoices] ADD [PaidAmount] decimal(18,2) NOT NULL DEFAULT 0.0;
END

IF OBJECT_ID(N'[dbo].[InvoicePayments]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[InvoicePayments] (
        [Id] int NOT NULL IDENTITY(1,1),
        [InvoiceId] int NOT NULL,
        [ReceiptNumber] nvarchar(50) NOT NULL,
        [PaymentType] nvarchar(20) NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [PaymentMethod] nvarchar(30) NOT NULL,
        [ReferenceCode] nvarchar(100) NULL,
        [Note] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_InvoicePayments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_InvoicePayments_Invoices_InvoiceId]
            FOREIGN KEY ([InvoiceId]) REFERENCES [dbo].[Invoices] ([Id]) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX [IX_InvoicePayments_ReceiptNumber]
        ON [dbo].[InvoicePayments] ([ReceiptNumber]);
END
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[dbo].[InvoicePayments]', N'U') IS NULL
BEGIN
    DROP TABLE [dbo].[InvoicePayments];
END

IF COL_LENGTH(N'dbo.Invoices', N'PaidAmount') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Invoices] DROP COLUMN [PaidAmount];
END
");
        }
    }
}

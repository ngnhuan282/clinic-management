using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddReceptionCheckInBooks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CheckedInAt",
                table: "Appointments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PatientProfileId",
                table: "Appointments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Patients",
                columns: table => new
                {
                    PatientId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    BirthDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IdentityNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InsuranceCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Patients", x => x.PatientId);
                });

            migrationBuilder.CreateTable(
                name: "BookInvoices",
                columns: table => new
                {
                    BookInvoiceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientId = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookInvoices", x => x.BookInvoiceId);
                    table.CheckConstraint("CK_BookInvoices_Amount", "[Amount] > 0");
                    table.CheckConstraint("CK_BookInvoices_PaymentTime", "([Status] = 'Unpaid' AND [PaidAt] IS NULL) OR ([Status] = 'Paid' AND [PaidAt] IS NOT NULL)");
                    table.CheckConstraint("CK_BookInvoices_Status", "[Status] IN ('Unpaid','Paid')");
                    table.ForeignKey(
                        name: "FK_BookInvoices_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Restrict);
                });

            // Paper-book tracking already owns PatientBooks and the shared appointment columns.
            // Preserve book IDs and references while moving their owners from Users to Patients.
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM PatientBooks
           WHERE PatientId IS NULL OR BookNumber IS NULL OR Status NOT IN ('Issued','Voided'))
    THROW 51000, 'Resolve patient books with missing owners/numbers or unsupported statuses before upgrading.', 1;
IF EXISTS (SELECT 1 FROM Appointments
           WHERE (PatientBookId IS NULL AND BookVerifiedAt IS NOT NULL)
              OR (PatientBookId IS NOT NULL AND BookVerifiedAt IS NULL))
    THROW 51000, 'Resolve inconsistent appointment book verification before upgrading.', 1;

SET IDENTITY_INSERT Patients ON;
INSERT INTO Patients (PatientId, FullName, Phone, CreatedAt)
SELECT u.UserId, u.FullName, COALESCE(u.Phone, ''), u.CreatedAt
FROM Users u WHERE EXISTS (SELECT 1 FROM PatientBooks b WHERE b.PatientId = u.UserId);
SET IDENTITY_INSERT Patients OFF;

UPDATE PatientBooks SET IssuedAt = CreatedAt WHERE IssuedAt IS NULL;
UPDATE a SET PatientProfileId = b.PatientId, CheckedInAt = a.BookVerifiedAt
FROM Appointments a JOIN PatientBooks b ON b.PatientBookId = a.PatientBookId;

ALTER TABLE PatientBooks DROP CONSTRAINT FK_PatientBooks_Users_PatientId;
DROP INDEX IX_PatientBooks_PatientId ON PatientBooks;
DROP INDEX IX_PatientBooks_BookNumber ON PatientBooks;
ALTER TABLE PatientBooks ALTER COLUMN PatientId int NOT NULL;
ALTER TABLE PatientBooks ALTER COLUMN BookNumber nvarchar(40) NOT NULL;
ALTER TABLE PatientBooks ALTER COLUMN IssuedAt datetime2 NOT NULL;
ALTER TABLE PatientBooks ADD BookInvoiceId int NULL;
ALTER TABLE PatientBooks ADD CONSTRAINT FK_PatientBooks_Patients_PatientId
    FOREIGN KEY (PatientId) REFERENCES Patients (PatientId);
ALTER TABLE PatientBooks ADD CONSTRAINT FK_PatientBooks_BookInvoices_BookInvoiceId
    FOREIGN KEY (BookInvoiceId) REFERENCES BookInvoices (BookInvoiceId);
ALTER TABLE PatientBooks ADD CONSTRAINT CK_PatientBooks_Status CHECK (Status IN ('Issued','Voided'));

CREATE UNIQUE INDEX IX_PatientBooks_PatientId ON PatientBooks (PatientId)
    WHERE PatientId IS NOT NULL AND Status = 'Issued';
");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Code",
                keyValue: "appointments.checkIn",
                column: "IsImplemented",
                value: true);

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Code",
                keyValue: "billing.create",
                columns: new[] { "IsImplemented", "Name" },
                values: new object[] { true, "Lập hóa đơn sổ khám" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Code",
                keyValue: "billing.recordPayment",
                columns: new[] { "IsImplemented", "Name" },
                values: new object[] { true, "Ghi nhận thanh toán sổ khám" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Code",
                keyValue: "billing.view",
                columns: new[] { "IsImplemented", "Name" },
                values: new object[] { true, "Xem hóa đơn sổ khám" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_PatientProfileId",
                table: "Appointments",
                column: "PatientProfileId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Appointments_BookVerification",
                table: "Appointments",
                sql: "([PatientBookId] IS NULL AND [BookVerifiedAt] IS NULL AND [CheckedInAt] IS NULL) OR ([PatientBookId] IS NOT NULL AND [BookVerifiedAt] IS NOT NULL AND [CheckedInAt] IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_BookInvoices_PatientId",
                table: "BookInvoices",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientBooks_BookInvoiceId",
                table: "PatientBooks",
                column: "BookInvoiceId",
                unique: true,
                filter: "[BookInvoiceId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PatientBooks_BookNumber",
                table: "PatientBooks",
                column: "BookNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Patients_IdentityNumber",
                table: "Patients",
                column: "IdentityNumber",
                unique: true,
                filter: "[IdentityNumber] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Patients_Phone",
                table: "Patients",
                column: "Phone");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_Patients_PatientProfileId",
                table: "Appointments",
                column: "PatientProfileId",
                principalTable: "Patients",
                principalColumn: "PatientId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_Patients_PatientProfileId",
                table: "Appointments");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM PatientBooks b
           LEFT JOIN Users u ON u.UserId = b.PatientId
           JOIN Patients p ON p.PatientId = b.PatientId
           WHERE u.UserId IS NULL OR u.FullName <> p.FullName OR COALESCE(u.Phone, '') <> p.Phone
              OR DATALENGTH(b.BookNumber) > 60)
    THROW 51000, 'Patient books cannot be safely mapped back to legacy user accounts.', 1;

ALTER TABLE PatientBooks DROP CONSTRAINT FK_PatientBooks_Patients_PatientId;
ALTER TABLE PatientBooks DROP CONSTRAINT FK_PatientBooks_BookInvoices_BookInvoiceId;
ALTER TABLE PatientBooks DROP CONSTRAINT CK_PatientBooks_Status;
DROP INDEX IX_PatientBooks_BookInvoiceId ON PatientBooks;
DROP INDEX IX_PatientBooks_PatientId ON PatientBooks;
DROP INDEX IX_PatientBooks_BookNumber ON PatientBooks;
ALTER TABLE PatientBooks DROP COLUMN BookInvoiceId;
ALTER TABLE PatientBooks ALTER COLUMN PatientId int NULL;
ALTER TABLE PatientBooks ALTER COLUMN BookNumber nvarchar(30) NULL;
ALTER TABLE PatientBooks ALTER COLUMN IssuedAt datetime2 NULL;
ALTER TABLE PatientBooks ADD CONSTRAINT FK_PatientBooks_Users_PatientId
    FOREIGN KEY (PatientId) REFERENCES Users (UserId);
CREATE UNIQUE INDEX IX_PatientBooks_PatientId ON PatientBooks (PatientId)
    WHERE PatientId IS NOT NULL AND Status = 'Issued';
CREATE UNIQUE INDEX IX_PatientBooks_BookNumber ON PatientBooks (BookNumber)
    WHERE BookNumber IS NOT NULL;
");

            migrationBuilder.DropTable(
                name: "BookInvoices");

            migrationBuilder.DropTable(
                name: "Patients");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_PatientProfileId",
                table: "Appointments");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Appointments_BookVerification",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "CheckedInAt",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "PatientProfileId",
                table: "Appointments");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Code",
                keyValue: "appointments.checkIn",
                column: "IsImplemented",
                value: false);

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Code",
                keyValue: "billing.create",
                columns: new[] { "IsImplemented", "Name" },
                values: new object[] { false, "Lập hóa đơn" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Code",
                keyValue: "billing.recordPayment",
                columns: new[] { "IsImplemented", "Name" },
                values: new object[] { false, "Ghi nhận thanh toán" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Code",
                keyValue: "billing.view",
                columns: new[] { "IsImplemented", "Name" },
                values: new object[] { false, "Xem hóa đơn" });
        }
    }
}

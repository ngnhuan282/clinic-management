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
                name: "BookVerifiedAt",
                table: "Appointments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CheckedInAt",
                table: "Appointments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PatientBookId",
                table: "Appointments",
                type: "int",
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

            migrationBuilder.CreateTable(
                name: "PatientBooks",
                columns: table => new
                {
                    PatientBookId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientId = table.Column<int>(type: "int", nullable: false),
                    BookNumber = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    BookInvoiceId = table.Column<int>(type: "int", nullable: true),
                    IssuedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientBooks", x => x.PatientBookId);
                    table.CheckConstraint("CK_PatientBooks_Status", "[Status] IN ('Issued','Voided')");
                    table.ForeignKey(
                        name: "FK_PatientBooks_BookInvoices_BookInvoiceId",
                        column: x => x.BookInvoiceId,
                        principalTable: "BookInvoices",
                        principalColumn: "BookInvoiceId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PatientBooks_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Restrict);
                });

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
                name: "IX_Appointments_PatientBookId",
                table: "Appointments",
                column: "PatientBookId");

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
                name: "IX_PatientBooks_PatientId",
                table: "PatientBooks",
                column: "PatientId");

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
                name: "FK_Appointments_PatientBooks_PatientBookId",
                table: "Appointments",
                column: "PatientBookId",
                principalTable: "PatientBooks",
                principalColumn: "PatientBookId",
                onDelete: ReferentialAction.Restrict);

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
                name: "FK_Appointments_PatientBooks_PatientBookId",
                table: "Appointments");

            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_Patients_PatientProfileId",
                table: "Appointments");

            migrationBuilder.DropTable(
                name: "PatientBooks");

            migrationBuilder.DropTable(
                name: "BookInvoices");

            migrationBuilder.DropTable(
                name: "Patients");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_PatientBookId",
                table: "Appointments");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_PatientProfileId",
                table: "Appointments");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Appointments_BookVerification",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "BookVerifiedAt",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "CheckedInAt",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "PatientBookId",
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

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class CompleteHoangReceptionWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IssuedByUserId",
                table: "PatientBooks",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PatientBookRequests",
                columns: table => new
                {
                    PatientBookRequestId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientId = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    RequestedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    BookInvoiceId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientBookRequests", x => x.PatientBookRequestId);
                    table.ForeignKey(
                        name: "FK_PatientBookRequests_BookInvoices_BookInvoiceId",
                        column: x => x.BookInvoiceId,
                        principalTable: "BookInvoices",
                        principalColumn: "BookInvoiceId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PatientBookRequests_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PatientBookRequests_Users_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.Sql("""
                UPDATE [Permissions] SET [IsImplemented] = 1, [Scope] = N'Chỉ lịch của bệnh nhân đăng nhập'
                WHERE [Code] = N'appointments.cancelOwn';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_PatientBooks_IssuedByUserId",
                table: "PatientBooks",
                column: "IssuedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientBookRequests_BookInvoiceId",
                table: "PatientBookRequests",
                column: "BookInvoiceId",
                unique: true,
                filter: "[BookInvoiceId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PatientBookRequests_PatientId",
                table: "PatientBookRequests",
                column: "PatientId",
                unique: true,
                filter: "[BookInvoiceId] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PatientBookRequests_RequestedByUserId",
                table: "PatientBookRequests",
                column: "RequestedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_PatientBooks_Users_IssuedByUserId",
                table: "PatientBooks",
                column: "IssuedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PatientBooks_Users_IssuedByUserId",
                table: "PatientBooks");

            migrationBuilder.DropTable(
                name: "PatientBookRequests");

            migrationBuilder.DropIndex(
                name: "IX_PatientBooks_IssuedByUserId",
                table: "PatientBooks");

            migrationBuilder.DropColumn(
                name: "IssuedByUserId",
                table: "PatientBooks");

            migrationBuilder.Sql("""
                UPDATE [Permissions] SET [IsImplemented] = 0, [Scope] = NULL
                WHERE [Code] = N'appointments.cancelOwn';
                """);
        }
    }
}

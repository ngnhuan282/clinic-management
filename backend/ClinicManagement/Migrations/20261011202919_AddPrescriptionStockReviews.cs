using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddPrescriptionStockReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PrescriptionStockReviews",
                columns: table => new
                {
                    PrescriptionStockReviewId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrescriptionId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    ShortagesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecipientsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InvoiceId = table.Column<int>(type: "int", nullable: true),
                    PaymentStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ResolvedByUserId = table.Column<int>(type: "int", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrescriptionStockReviews", x => x.PrescriptionStockReviewId);
                    table.ForeignKey(
                        name: "FK_PrescriptionStockReviews_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PrescriptionStockReviews_Prescriptions_PrescriptionId",
                        column: x => x.PrescriptionId,
                        principalTable: "Prescriptions",
                        principalColumn: "PrescriptionId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PrescriptionStockReviews_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PrescriptionStockReviews_Users_ResolvedByUserId",
                        column: x => x.ResolvedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PrescriptionStockReviews_CreatedByUserId",
                table: "PrescriptionStockReviews",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PrescriptionStockReviews_InvoiceId",
                table: "PrescriptionStockReviews",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_PrescriptionStockReviews_PrescriptionId",
                table: "PrescriptionStockReviews",
                column: "PrescriptionId",
                unique: true,
                filter: "[Status] = 'Pending'");

            migrationBuilder.CreateIndex(
                name: "IX_PrescriptionStockReviews_ResolvedByUserId",
                table: "PrescriptionStockReviews",
                column: "ResolvedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PrescriptionStockReviews");
        }
    }
}

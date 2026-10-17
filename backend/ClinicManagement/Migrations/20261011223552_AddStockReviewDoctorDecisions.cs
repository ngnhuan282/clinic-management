using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddStockReviewDoctorDecisions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "PrescriptionStockReviews",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.Sql("UPDATE PrescriptionStockReviews SET UpdatedAt = COALESCE(ResolvedAt, CreatedAt)");

            migrationBuilder.CreateTable(
                name: "PrescriptionStockReviewDecisions",
                columns: table => new
                {
                    PrescriptionStockReviewDecisionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrescriptionStockReviewId = table.Column<int>(type: "int", nullable: false),
                    DoctorUserId = table.Column<int>(type: "int", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Outcome = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    BeforeJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AfterJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrescriptionStockReviewDecisions", x => x.PrescriptionStockReviewDecisionId);
                    table.ForeignKey(
                        name: "FK_PrescriptionStockReviewDecisions_PrescriptionStockReviews_PrescriptionStockReviewId",
                        column: x => x.PrescriptionStockReviewId,
                        principalTable: "PrescriptionStockReviews",
                        principalColumn: "PrescriptionStockReviewId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PrescriptionStockReviewDecisions_Users_DoctorUserId",
                        column: x => x.DoctorUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PrescriptionStockReviewDecisions_DoctorUserId",
                table: "PrescriptionStockReviewDecisions",
                column: "DoctorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PrescriptionStockReviewDecisions_PrescriptionStockReviewId",
                table: "PrescriptionStockReviewDecisions",
                column: "PrescriptionStockReviewId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PrescriptionStockReviewDecisions");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "PrescriptionStockReviews");
        }
    }
}

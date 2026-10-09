using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ClinicManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddPrescriptionDispensing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionCode", "RoleId" },
                keyValues: new object[] { "pharmacy.dispense", 3 });

            migrationBuilder.AddColumn<int>(
                name: "DispensedByUserId",
                table: "Prescriptions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DispenseDetails",
                columns: table => new
                {
                    DispenseDetailId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrescriptionDetailId = table.Column<int>(type: "int", nullable: false),
                    InventoryId = table.Column<int>(type: "int", nullable: false),
                    QuantityDispensed = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DispenseDetails", x => x.DispenseDetailId);
                    table.CheckConstraint("CK_DispenseDetails_QuantityDispensed", "[QuantityDispensed] > 0");
                    table.ForeignKey(
                        name: "FK_DispenseDetails_Inventory_InventoryId",
                        column: x => x.InventoryId,
                        principalTable: "Inventory",
                        principalColumn: "InventoryId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DispenseDetails_PrescriptionDetails_PrescriptionDetailId",
                        column: x => x.PrescriptionDetailId,
                        principalTable: "PrescriptionDetails",
                        principalColumn: "PrescriptionDetailId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Code",
                keyValue: "pharmacy.dispense",
                column: "IsImplemented",
                value: true);

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "RoleId", "Description", "IsSystem", "RoleName", "UpdatedAt" },
                values: new object[] { 7, "Pharmacist", true, "Pharmacist", null });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionCode", "RoleId" },
                values: new object[,]
                {
                    { "pharmacy.dispense", 7 },
                    { "pharmacy.viewCatalog", 7 },
                    { "pharmacy.viewInventory", 7 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Prescriptions_DispensedByUserId",
                table: "Prescriptions",
                column: "DispensedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DispenseDetails_InventoryId",
                table: "DispenseDetails",
                column: "InventoryId");

            migrationBuilder.CreateIndex(
                name: "IX_DispenseDetails_PrescriptionDetailId_InventoryId",
                table: "DispenseDetails",
                columns: new[] { "PrescriptionDetailId", "InventoryId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Prescriptions_Users_DispensedByUserId",
                table: "Prescriptions",
                column: "DispensedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Prescriptions_Users_DispensedByUserId",
                table: "Prescriptions");

            migrationBuilder.DropTable(
                name: "DispenseDetails");

            migrationBuilder.DropIndex(
                name: "IX_Prescriptions_DispensedByUserId",
                table: "Prescriptions");

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionCode", "RoleId" },
                keyValues: new object[] { "pharmacy.dispense", 7 });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionCode", "RoleId" },
                keyValues: new object[] { "pharmacy.viewCatalog", 7 });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionCode", "RoleId" },
                keyValues: new object[] { "pharmacy.viewInventory", 7 });

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 7);

            migrationBuilder.DropColumn(
                name: "DispensedByUserId",
                table: "Prescriptions");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Code",
                keyValue: "pharmacy.dispense",
                column: "IsImplemented",
                value: false);

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionCode", "RoleId" },
                values: new object[] { "pharmacy.dispense", 3 });
        }
    }
}

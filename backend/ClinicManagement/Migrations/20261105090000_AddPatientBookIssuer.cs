using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ClinicManagement.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261105090000_AddPatientBookIssuer")]
public sealed class AddPatientBookIssuer : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.PatientBooks', N'IssuedByUserId') IS NULL
    ALTER TABLE PatientBooks ADD IssuedByUserId INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.PatientBooks')
    AND name = N'IX_PatientBooks_IssuedByUserId')
    CREATE INDEX IX_PatientBooks_IssuedByUserId ON PatientBooks (IssuedByUserId);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID(N'dbo.PatientBooks')
    AND name = N'FK_PatientBooks_Users_IssuedByUserId')
    ALTER TABLE PatientBooks ADD CONSTRAINT FK_PatientBooks_Users_IssuedByUserId
        FOREIGN KEY (IssuedByUserId) REFERENCES Users (UserId) ON DELETE NO ACTION;
");

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(@"
ALTER TABLE PatientBooks DROP CONSTRAINT FK_PatientBooks_Users_IssuedByUserId;
DROP INDEX IX_PatientBooks_IssuedByUserId ON PatientBooks;
ALTER TABLE PatientBooks DROP COLUMN IssuedByUserId;
");
}

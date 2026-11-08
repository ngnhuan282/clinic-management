using System.Text.Json;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Helpers;
using ClinicManagement.Migrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

var databaseName = "ClinicContent_" + Guid.NewGuid().ToString("N");
var connection = $"Server=(localdb)\\MSSQLLocalDB;Database={databaseName};Trusted_Connection=True;TrustServerCertificate=True";
await using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(connection).Options);
var checks = 0;
void Check(bool condition, string label)
{
    if (!condition) throw new InvalidOperationException(label);
    checks++;
    Console.WriteLine("PASS " + label);
}
async Task<string> Snapshot() => JsonSerializer.Serialize(new
{
    departments = await db.Departments.AsNoTracking().OrderBy(x => x.DepartmentId).ToListAsync(),
    doctors = await db.Doctors.AsNoTracking().OrderBy(x => x.DoctorId).ToListAsync(),
    services = await db.LabTestTypes.AsNoTracking().OrderBy(x => x.Id).ToListAsync()
});
try
{
    var migrator = db.GetService<IMigrator>();
    await migrator.MigrateAsync("20261108022327_CompleteHoangReceptionWorkflow");
    var customDescription = "Nội dung riêng do quản trị viên biên soạn, cần được giữ nguyên.";
    (await db.Departments.SingleAsync(x => x.Code == "NOI")).Description = customDescription;
    (await db.Doctors.SingleAsync(x => x.DoctorId == 2)).Biography = customDescription;
    db.Departments.Add(new Department { Code = "TIM", Name = "Tim mach", Description = "Khoa mau cho phong kham", IsActive = true });
    db.Departments.Add(new Department { Code = "CUSTOM", Name = "Khoa được biên soạn riêng", Description = customDescription, IsActive = true });
    db.LabTestTypes.Add(new LabTestType { Name = "Cong thuc mau", Description = "Xet nghiem mau cho phong kham", Price = 100000 });
    await db.SaveChangesAsync();
    var counts = (await db.Departments.CountAsync(), await db.Doctors.CountAsync(), await db.Users.CountAsync(), await db.RolePermissions.CountAsync());
    await migrator.MigrateAsync();
    db.ChangeTracker.Clear();
    var upgradedNames = await db.Departments.Select(x => x.Name).ToListAsync();
    Check(!upgradedNames.Contains("Noi tong quat", StringComparer.Ordinal) && !upgradedNames.Contains("Tim mach", StringComparer.Ordinal), "Upgrade repairs legacy department names");
    Check((await db.Departments.SingleAsync(x => x.Code == "TIM")).Description!.Length > 150, "Upgrade replaces placeholder specialty descriptions");
    Check((await db.Departments.SingleAsync(x => x.Code == "NOI")).Description == customDescription, "Upgrade preserves administrator-authored descriptions");
    Check((await db.Departments.SingleAsync(x => x.Code == "CUSTOM")).Name == "Khoa được biên soạn riêng", "Unrelated departments remain unchanged");
    Check((await db.Doctors.SingleAsync(x => x.DoctorId == 2)).Biography == customDescription, "Upgrade preserves custom doctor biographies");
    Check((await db.Doctors.SingleAsync(x => x.DoctorId == 1)).FullName == "Nguyễn Minh An", "Doctor seed names are corrected at the database source");
    Check((await db.LabTestTypes.SingleAsync()).Name == "Công thức máu", "Service names are corrected at the database source");
    Check(counts == (await db.Departments.CountAsync(), await db.Doctors.CountAsync(), await db.Users.CountAsync(), await db.RolePermissions.CountAsync()), "Content repair preserves row counts, accounts and permissions");
    var before = await Snapshot();
    await db.Database.ExecuteSqlRawAsync(LocalizeVietnameseContent.RepairSql);
    Check(before == await Snapshot(), "Repeating the repair is idempotent");

    var directory = new DirectoryInfo(AppContext.BaseDirectory);
    while (directory != null && !File.Exists(Path.Combine(directory.FullName, "backend", "ClinicManagement", "ClinicManagement.csproj"))) directory = directory.Parent;
    var root = directory?.FullName ?? throw new DirectoryNotFoundException("Repository root not found.");
    // The comprehensive seed is exercised only on this owned, disposable test database.
    await db.Database.ExecuteSqlRawAsync(await File.ReadAllTextAsync(Path.Combine(root, "backend", "ClinicManagement", "Data", "Seed", "clinic-all-tables-demo.sql")));
    db.ChangeTracker.Clear();
    var departments = await db.Departments.AsNoTracking().ToListAsync();
    Check(departments.Count == 20 && departments.All(x => x.Description?.Length > 150), "Fresh demo seed provides useful descriptions for all 20 specialties");
    Check(departments.All(x => PublicSpecialtyContent.ForCode(x.Code) is { FocusAreas.Length: >= 3, Preparation.Length: >= 2 }), "All 20 public specialty pages have detailed content");
    Check(await db.Doctors.AllAsync(x => x.FullName.StartsWith("Bác sĩ mẫu ")), "Fresh demo doctor names use Vietnamese accents");
    Check(await db.Rooms.AllAsync(x => x.Name.StartsWith("Phòng khám ") && x.RoomType == "Khám bệnh"), "Room names and appointment location labels use Vietnamese accents");
    Check(await db.LabTestTypes.AnyAsync(x => x.Name == "Công thức máu") && await db.LabTestTypes.AnyAsync(x => x.Name == "Đường huyết"), "Fresh demo service prices retain accented names");
    Check(await db.PrescriptionDetails.AnyAsync(x => x.Dosage == "Sáng 1 viên"), "Seeded prescription instructions retain Vietnamese accents");
    Console.WriteLine("VIETNAMESE_CONTENT_SUCCESS checks=" + checks);
}
finally
{
    if (!databaseName.StartsWith("ClinicContent_", StringComparison.Ordinal)) throw new InvalidOperationException("Unexpected database name.");
    await db.Database.EnsureDeletedAsync();
    Console.WriteLine("CONTENT_FIXTURE_CLEANUP: disposable database removed");
}

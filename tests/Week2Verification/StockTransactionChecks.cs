using System.Data;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.Exceptions;
using ClinicManagement.Helpers;
using ClinicManagement.Repositories.Implementations;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Implementations;
using ClinicManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

internal static class StockTransactionChecks
{
    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password, Action<bool, string> check)
    {
        var connection = db.Database.GetDbConnection().ConnectionString;
        var database = db.Database.GetDbConnection().Database;
        if (!database.StartsWith("ClinicWeek2Test_", StringComparison.Ordinal)
            || !Guid.TryParseExact(database["ClinicWeek2Test_".Length..], "N", out _))
            throw new InvalidOperationException("Stock transaction checks require a random verification database.");
        var fixture = await PrescriptionDispensingChecks.RunAsync(client, db, password, check);
        async Task<(int Status, JsonNode? Body)> Request(string method, string path, string? token = null, object? body = null)
        {
            using var request = new HttpRequestMessage(new HttpMethod(method), "api/" + path);
            if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            var json = string.IsNullOrWhiteSpace(text) ? null : JsonNode.Parse(text);
            return ((int)response.StatusCode, json is JsonObject envelope && envelope.ContainsKey("result") ? envelope["result"] : json);
        }
        async Task<JsonNode> Send(string method, string path, string? token = null, object? body = null, int status = 200)
        {
            var result = await Request(method, path, token, body);
            check(result.Status == status, $"D10 {method} {path}: expected {status}, got {result.Status}");
            return result.Body!;
        }
        async Task<string> Login(string username) => (await Send("POST", "auth/login", body: new { username, password }))["accessToken"]!.GetValue<string>();
        var admin = await Login("testadmin");
        var adminId = await db.Users.Where(x => x.Username == "testadmin").Select(x => x.UserId).SingleAsync();
        var supplier = await db.Suppliers.Select(x => x.SupplierId).FirstAsync();
        var category = await db.MedicineCategories.Select(x => x.CategoryId).FirstAsync();
        var today = ClinicClock.Today;
        async Task<Inventory> Lot(string label, int quantity = 10)
        {
            var lot = new Inventory { Medicine = new Medicine { MedicineName = "D10 " + label, SupplierId = supplier,
                CategoryId = category, Unit = "Vien", UnitPrice = 1000m }, BatchNumber = "D10-" + label,
                QuantityInStock = quantity, ExpiryDate = today.AddDays(90) };
            db.Inventory.Add(lot);
            await db.SaveChangesAsync();
            return lot;
        }
        object Purchase(Inventory lot, int quantity) => new { supplierId = supplier, details = new[] {
            new { medicineId = lot.MedicineId, batchNumber = lot.BatchNumber, expiryDate = lot.ExpiryDate, quantity, unitPrice = 1000m } } };
        async Task<int> NewPurchase(Inventory lot, int quantity = 7) =>
            (await Send("POST", "purchase-orders", admin, Purchase(lot, quantity), 201))["purchaseOrderId"]!.GetValue<int>();
        async Task<int> Quantity(int id) => await db.Inventory.AsNoTracking().Where(x => x.InventoryId == id).Select(x => x.QuantityInStock).SingleAsync();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(connection).Options;

        foreach (var mode in new[] { "cancel", "edit" })
        for (var iteration = 0; iteration < 3; iteration++)
        {
            var lot = await Lot($"{mode}-{iteration}");
            var id = await NewPurchase(lot);
            await using var staleDb = new ApplicationDbContext(options);
            var gate = new ReadGate(new PurchaseOrderRepository(staleDb));
            var service = new PurchaseOrderService(gate, new SupplierRepository(staleDb), new TestUser(adminId));
            async Task<int> Change()
            {
                try
                {
                    if (mode == "cancel") await service.CancelAsync(id);
                    else await service.UpdateAsync(id, new UpdatePurchaseOrderRequest { SupplierId = supplier,
                        Details = [new PurchaseOrderDetailRequest { MedicineId = lot.MedicineId, BatchNumber = lot.BatchNumber,
                            ExpiryDate = lot.ExpiryDate, Quantity = 3, UnitPrice = 1000m }] });
                    return 200;
                }
                catch (AppException error) { return (int)error.ErrorCode.StatusCode; }
            }
            var change = Change();
            await gate.ReadCompleted.Task.WaitAsync(TimeSpan.FromSeconds(15));
            var receive = Request("POST", $"purchase-orders/{id}/receive", admin);
            try { await Task.Delay(150); } finally { gate.Continue.TrySetResult(true); }
            var statuses = new[] { await change.WaitAsync(TimeSpan.FromSeconds(45)), (await receive).Status };
            check(statuses.All(x => x is 200 or 409), $"D10 receive versus {mode} returns success/conflict, never 500: {string.Join(',', statuses)}");
            var saved = await db.PurchaseOrders.AsNoTracking().Include(x => x.Details).SingleAsync(x => x.PurchaseOrderId == id);
            var expected = 10 + (saved.Status == "Received" ? saved.Details.Single().Quantity : 0);
            check(await Quantity(lot.InventoryId) == expected, $"D10 receive versus {mode} preserves receipt and stock together");
            if (mode == "cancel") check(statuses.Count(x => x == 200) == 1, "D10 cancel and receive cannot both succeed");
        }

        var repeatedLot = await Lot("double-receive");
        var repeatedId = await NewPurchase(repeatedLot);
        var repeated = await Task.WhenAll(Request("POST", $"purchase-orders/{repeatedId}/receive", admin), Request("POST", $"purchase-orders/{repeatedId}/receive", admin));
        check(repeated.Count(x => x.Status == 200) == 1 && repeated.All(x => x.Status is 200 or 409)
            && await Quantity(repeatedLot.InventoryId) == 17, "D10 concurrent receipt confirmation adds inventory exactly once");

        var pharmacist = await Login("d8pharmacist");

        var pharmacyRoleId = await db.Roles.Where(x => x.RoleName == RoleConstants.Pharmacist).Select(x => x.RoleId).SingleAsync();
        var role = await Send("GET", $"rbac/roles/{pharmacyRoleId}", admin);
        var rights = role["permissionCodes"]!.AsArray().Select(x => x!.GetValue<string>()).ToArray();
        var beforeRightsStock = await db.Inventory.AsNoTracking().SumAsync(x => x.QuantityInStock);
        try
        {
            await Send("PUT", $"rbac/roles/{pharmacyRoleId}/permissions", admin, new { version = role["version"]!.GetValue<string>(),
                permissionCodes = rights.Where(x => x != PermissionCodes.PharmacyDispense).ToArray() });
            await Send("GET", "dispensing", pharmacist, status: 401);
            pharmacist = await Login("d8pharmacist");
            await Send("GET", "inventory", pharmacist);
            foreach (var (method, path) in new[] { ("GET", "dispensing"), ("GET", "dispensing/summary"), ("GET", $"dispensing/{fixture.ShortagePrescriptionId}"),
                ("POST", $"dispensing/{fixture.ShortagePrescriptionId}/confirm"), ("POST", $"dispensing/{fixture.ShortagePrescriptionId}/stock-reviews"),
                ("POST", $"dispensing/{fixture.ShortagePrescriptionId}/stock-reviews/recheck") })
                await Send(method, path, pharmacist, status: 403);
        }
        finally
        {
            role = await Send("GET", $"rbac/roles/{pharmacyRoleId}", admin);
            await Send("PUT", $"rbac/roles/{pharmacyRoleId}/permissions", admin, new { version = role["version"]!.GetValue<string>(), permissionCodes = rights });
        }
        pharmacist = await Login("d8pharmacist");
        var pharmacistId = await db.Users.Where(x => x.Username == "d8pharmacist").Select(x => x.UserId).SingleAsync();
        await Send("PATCH", $"users/{pharmacistId}/status", admin, new { status = false });
        await Send("GET", "dispensing", pharmacist, status: 401);
        await Send("POST", $"dispensing/{fixture.ShortagePrescriptionId}/confirm", pharmacist, status: 401);
        await Send("PATCH", $"users/{pharmacistId}/status", admin, new { status = true });
        check(await db.Inventory.AsNoTracking().SumAsync(x => x.QuantityInStock) == beforeRightsStock, "D10 rejected permission and locked-account requests do not change inventory");
    }

    private sealed class TestUser(int id) : ICurrentUserService
    {
        public bool IsAuthenticated => true;
        public int? UserId => id;
        public string? Role => RoleConstants.Admin;
        public int GetRequiredUserId() => id;
    }

    // Pause after the real SQL read to exercise the old read/write race deterministically.
    private sealed class ReadGate(IPurchaseOrderRepository inner) : IPurchaseOrderRepository
    {
        private int reads;
        public TaskCompletionSource<bool> ReadCompleted { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource<bool> Continue { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public async Task<PurchaseOrder?> GetByIdAsync(int id)
        {
            var result = await inner.GetByIdAsync(id);
            if (Interlocked.Increment(ref reads) == 1) { ReadCompleted.TrySetResult(true); await Continue.Task.WaitAsync(TimeSpan.FromSeconds(30)); }
            return result;
        }
        public Task<(IEnumerable<PurchaseOrder> Items, int TotalItems)> GetPagedAsync(PurchaseOrderFilterRequest value) => inner.GetPagedAsync(value);
        public Task<IReadOnlyList<PurchaseOrder>> GetAllAsync() => inner.GetAllAsync();
        public Task<IReadOnlySet<int>> GetExistingMedicineIdsAsync(IEnumerable<int> ids) => inner.GetExistingMedicineIdsAsync(ids);
        public Task<bool> AreMedicinesFromSupplierAsync(int id, IEnumerable<int> ids) => inner.AreMedicinesFromSupplierAsync(id, ids);
        public Task<Inventory?> GetInventoryLotAsync(int id, string batch) => inner.GetInventoryLotAsync(id, batch);
        public Task AddAsync(PurchaseOrder value) => inner.AddAsync(value);
        public Task AddInventoryAsync(Inventory value) => inner.AddInventoryAsync(value);
        public Task SaveChangesAsync() => inner.SaveChangesAsync();
        public Task<IDbContextTransaction> BeginTransactionAsync(IsolationLevel level) => inner.BeginTransactionAsync(level);
    }
}

using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Helpers;
using Microsoft.EntityFrameworkCore;

internal static class InventoryWarningChecks
{
    public static async Task<(int CategoryId, int MedicineId)> RunAsync(
        HttpClient client, ApplicationDbContext db, string password, Action<bool, string> check)
    {
        var today = ClinicClock.Today;
        var pharmacistRole = await db.Roles.SingleAsync(x => x.RoleName == "Pharmacist");
        db.Users.Add(new User { Username = "testpharmacist", FullName = "D7 Test Pharmacist", RoleId = pharmacistRole.RoleId,
            PasswordHash = (await db.Users.SingleAsync(x => x.Username == "testadmin")).PasswordHash, CreatedAt = DateTime.UtcNow });
        db.Users.Add(new User { Username = "testpatientd7", FullName = "D7 Test Patient",
            RoleId = (await db.Roles.SingleAsync(x => x.RoleName == "Patient")).RoleId,
            PasswordHash = (await db.Users.SingleAsync(x => x.Username == "testadmin")).PasswordHash, CreatedAt = DateTime.UtcNow });
        var category = new MedicineCategory { CategoryName = "D7 Inventory Checks" };
        var supplier = new Supplier { SupplierName = "D7 Test Supplier" };
        var medicine = new Medicine { MedicineName = "D7 Test Medicine", Category = category, Supplier = supplier, Unit = "Viên", UnitPrice = 1000m };
        var lots = new[]
        {
            ("D7-EXPIRED", 60, -1), ("D7-EXPIRED-LOW", 5, -5), ("D7-EMPTY-EXPIRED", 0, -2),
            ("D7-TODAY", 10, 0), ("D7-LOW-NEAR", 1, 30), ("D7-NORMAL-A", 11, 31),
            ("D7-NORMAL-B", 11, 31), ("D7-EMPTY-VALID", 0, 40), ("D7-NEAR", 20, 1)
        }.Select(x => new Inventory { Medicine = medicine, BatchNumber = x.Item1, QuantityInStock = x.Item2,
            ExpiryDate = today.AddDays(x.Item3) }).ToArray();
        db.AddRange(lots);
        await db.SaveChangesAsync();

        async Task<JsonNode?> Send(HttpMethod method, string path, object? body = null, int status = 200)
        {
            using var request = new HttpRequestMessage(method, path);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync());
            check((int)response.StatusCode == status, $"D7 {method} {path}: expected {status}, got {(int)response.StatusCode}");
            return payload?["result"];
        }
        async Task Login(string username)
        {
            client.DefaultRequestHeaders.Authorization = null;
            var result = await Send(HttpMethod.Post, "api/auth/login", new { username, password });
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", result!["accessToken"]!.GetValue<string>());
        }
        var query = $"api/inventory?categoryId={category.CategoryId}&pageSize=100";
        async Task<JsonArray> GetLots(string extra = "") => (await Send(HttpMethod.Get, query + extra))!["items"]!.AsArray();
        async Task ExpectBatches(string extra, params string[] expected)
        {
            var result = await GetLots(extra);
            check(result.Select(x => x!["batchNumber"]!.GetValue<string>()).OrderBy(x => x).SequenceEqual(expected.OrderBy(x => x)),
                $"D7 independent lot filter {extra} returns exactly the expected batches");
        }

        await Send(HttpMethod.Get, "api/inventory", status: 401);
        await Login("testadmin");
        var items = await GetLots();
        check(items.Count == 9, "D7 list includes expired and empty batches for traceability");
        foreach (var lot in lots)
        {
            var item = items.Single(x => x!["inventoryId"]!.GetValue<int>() == lot.InventoryId)!;
            var days = lot.ExpiryDate.DayNumber - today.DayNumber;
            var stock = lot.QuantityInStock == 0 ? "OutOfStock" : lot.QuantityInStock <= 10 ? "LowStock" : "InStock";
            var expiry = days < 0 ? "Expired" : days <= 30 ? "ExpiringSoon" : "Valid";
            check(item["stockLevel"]!.GetValue<string>() == stock && item["expiryStatus"]!.GetValue<string>() == expiry
                && item["daysUntilExpiry"]!.GetValue<int>() == days
                && item["availableQuantity"]!.GetValue<int>() == (days < 0 ? 0 : lot.QuantityInStock),
                $"D7 {lot.BatchNumber}: physical stock, local expiry and available quantity remain independent");
        }
        await ExpectBatches("&stockLevel=LowStock", "D7-EXPIRED-LOW", "D7-TODAY", "D7-LOW-NEAR");
        await ExpectBatches("&expiryStatus=ExpiringSoon", "D7-TODAY", "D7-LOW-NEAR", "D7-NEAR");
        await ExpectBatches("&expiryStatus=Expired", "D7-EXPIRED", "D7-EXPIRED-LOW", "D7-EMPTY-EXPIRED");
        await ExpectBatches("&stockLevel=LowStock&expiryStatus=ExpiringSoon", "D7-TODAY", "D7-LOW-NEAR");
        await ExpectBatches("&stockLevel=OutOfStock&expiryStatus=Expired", "D7-EMPTY-EXPIRED");
        await ExpectBatches("&stockLevel=InStock&expiryStatus=Valid", "D7-NORMAL-A", "D7-NORMAL-B");
        await ExpectBatches("&batchNumber=%20D7-NORMAL%20", "D7-NORMAL-A", "D7-NORMAL-B");
        await ExpectBatches($"&supplierId={supplier.SupplierId}&medicineId={medicine.MedicineId}&search=D7%20Test&batchNumber=LOW&expiryStatus=ExpiringSoon", "D7-LOW-NEAR");
        await ExpectBatches("&batchNumber=DOES-NOT-EXIST");
        await ExpectBatches("&stockStatus=LowStock", "D7-TODAY", "D7-LOW-NEAR");
        await ExpectBatches("&stockStatus=ExpiringSoon", "D7-NEAR");
        await Send(HttpMethod.Get, query + "&stockLevel=Invalid", status: 400);
        await Send(HttpMethod.Get, query + "&expiryStatus=Invalid", status: 400);
        await Send(HttpMethod.Get, query + "&search=" + new string('a', 201), status: 400);
        await Send(HttpMethod.Get, query + "&batchNumber=" + new string('a', 51), status: 400);

        foreach (var sort in new[] { "expiry", "quantity", "medicine", "batch" })
        foreach (var direction in new[] { "asc", "desc" })
        {
            var sorted = await GetLots($"&sortBy={sort}&sortOrder={direction}");
            IOrderedEnumerable<Inventory> expected = sort switch
            {
                "quantity" => direction == "asc" ? lots.OrderBy(x => x.QuantityInStock) : lots.OrderByDescending(x => x.QuantityInStock),
                "batch" => direction == "asc" ? lots.OrderBy(x => x.BatchNumber) : lots.OrderByDescending(x => x.BatchNumber),
                "medicine" => lots.OrderBy(x => x.Medicine.MedicineName),
                _ => direction == "asc" ? lots.OrderBy(x => x.ExpiryDate) : lots.OrderByDescending(x => x.ExpiryDate)
            };
            if (sort != "expiry") expected = expected.ThenBy(x => x.ExpiryDate);
            expected = expected.ThenBy(x => x.BatchNumber).ThenBy(x => x.InventoryId);
            check(sorted.Select(x => x!["inventoryId"]!.GetValue<int>()).SequenceEqual(expected.Select(x => x.InventoryId)),
                $"D7 {sort}/{direction} sort is deterministic, including equal dates and quantities");
        }
        var first = (await Send(HttpMethod.Get, query + "&sortBy=expiry&pageSize=5&pageNumber=1"))!;
        var second = (await Send(HttpMethod.Get, query + "&sortBy=expiry&pageSize=5&pageNumber=2"))!;
        var pagedIds = first["items"]!.AsArray().Concat(second["items"]!.AsArray())
            .Select(x => x!["inventoryId"]!.GetValue<int>()).ToArray();
        check(first["totalItems"]!.GetValue<int>() == 9 && pagedIds.Length == 9 && pagedIds.Distinct().Count() == 9,
            "D7 pagination never duplicates or loses same-date batches");

        var allStock = await db.Inventory.AsNoTracking().ToListAsync();
        var snapshot = allStock.OrderBy(x => x.InventoryId).Select(x => (x.InventoryId, x.QuantityInStock, x.ExpiryDate, x.BatchNumber)).ToArray();
        var summary = (await Send(HttpMethod.Get, "api/inventory/summary"))!;
        check(summary["availableQuantity"]!.GetValue<int>() == allStock.Where(x => x.ExpiryDate >= today).Sum(x => x.QuantityInStock)
            && summary["totalQuantity"]!.GetValue<int>() == allStock.Sum(x => x.QuantityInStock)
            && summary["totalBatches"]!.GetValue<int>() == allStock.Count,
            "D7 available stock excludes expired quantities but retains physical totals");
        check(summary["lowStockBatches"]!.GetValue<int>() == allStock.Count(x => x.QuantityInStock > 0 && x.QuantityInStock <= 10)
            && summary["outOfStockBatches"]!.GetValue<int>() == allStock.Count(x => x.QuantityInStock == 0)
            && summary["expiredBatches"]!.GetValue<int>() == allStock.Count(x => x.ExpiryDate < today)
            && summary["expiringSoonBatches"]!.GetValue<int>() == allStock.Count(x => x.ExpiryDate >= today && x.ExpiryDate <= today.AddDays(30)),
            "D7 summary counts overlapping warnings without hiding low or empty expiring lots");
        var filteredSummary = (await Send(HttpMethod.Get, "api/inventory/summary?stockLevel=LowStock&categoryId=" + category.CategoryId))!;
        check(summary.ToJsonString() == filteredSummary.ToJsonString(), "D7 dashboard totals are global, independent of list filters");

        await Login("testpharmacist");
        await GetLots();
        await Send(HttpMethod.Get, "api/inventory/summary");
        await Send(HttpMethod.Get, $"api/inventory/{lots[0].InventoryId}");
        await Send(HttpMethod.Get, "api/medicine-categories/options");
        await Send(HttpMethod.Get, "api/suppliers/options");
        var writeBody = new { medicineId = medicine.MedicineId, batchNumber = "D7-FORBIDDEN", quantityInStock = 1, expiryDate = today.AddDays(90) };
        await Send(HttpMethod.Post, "api/inventory", writeBody, 403);
        await Send(HttpMethod.Put, $"api/inventory/{lots[0].InventoryId}", writeBody, 403);
        await Send(HttpMethod.Delete, $"api/inventory/{lots[0].InventoryId}", status: 403);
        await Send(HttpMethod.Get, "api/purchase-orders");
        await Send(HttpMethod.Post, "api/purchase-orders", new { supplierId = supplier.SupplierId, orderDate = today,
            details = new[] { new { medicineId = medicine.MedicineId, batchNumber = "D7-FORBIDDEN", quantity = 1, unitPrice = 1000, expiryDate = today.AddDays(90) } } }, 403);
        await Send(HttpMethod.Post, "api/purchase-orders/1/receive", status: 403);
        await Login("testreceptionist");
        await Send(HttpMethod.Get, "api/inventory", status: 403);
        await Send(HttpMethod.Get, "api/inventory/summary", status: 403);
        await Login("testpatientd7");
        await Send(HttpMethod.Get, "api/inventory", status: 403);
        await Send(HttpMethod.Get, "api/inventory/summary", status: 403);
        await Send(HttpMethod.Get, $"api/inventory/{lots[0].InventoryId}", status: 403);
        await Login("testdoctor");
        await Send(HttpMethod.Get, "api/inventory");
        check(snapshot.SequenceEqual((await db.Inventory.AsNoTracking().OrderBy(x => x.InventoryId).ToListAsync())
                .Select(x => (x.InventoryId, x.QuantityInStock, x.ExpiryDate, x.BatchNumber))),
            "D7 read/filter/sort operations and forbidden writes never change any batch");
        client.DefaultRequestHeaders.Authorization = null;
        return (category.CategoryId, medicine.MedicineId);
    }
}

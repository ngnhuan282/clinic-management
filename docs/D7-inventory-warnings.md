# D7: Inventory Warnings And Lot Filters

## Implemented Scope

- Reuse the inventory page at `/internal/medicines/inventory` for inventory managers.
- Pharmacists have a read-only sidebar entry at `/internal/pharmacy/inventory`, guarded by role and `pharmacy.viewInventory`. Catalog, purchase order and inventory write permissions remain unchanged.
- Category/supplier options load only with `pharmacy.viewCatalog`. A stock reader without that permission can still search and filter stock/expiry/batch; catalog filters are disabled rather than blocking the page. Management tabs remain permission-based and are omitted when none are available.
- Search by medicine/catalog/supplier and batch number; combine category, supplier, physical stock level and expiry filters; paginate and sort by medicine, quantity or expiry date.
- Existing legacy `stockStatus` query/response remains available. New UI uses independent `stockLevel` and `expiryStatus`, so a low or empty batch can also show an expiry warning.

## Counting Rules

- Use `ClinicClock.Today` (Asia/Ho_Chi_Minh) consistently for each inventory query and mapping.
- Physical stock: `OutOfStock` at zero, `LowStock` from 1 to 10, `InStock` above 10, using existing `MedicineMapping` thresholds.
- Expiry: `Expired` before today; `ExpiringSoon` from today through day 30 inclusive; `Valid` beyond day 30. Expiry warnings include empty batches for traceability.
- A batch expiring today remains available through today, matching the existing dispensing rule. An expired batch has `availableQuantity = 0` without deleting its physical stock.
- `totalQuantity` retains the physical total; `availableQuantity` excludes expired stock. These are aggregate unit counts, not a claim that different medicines share the same unit.
- Summary totals cover all inventory, not only the current page/filter. Stock and expiry counts overlap intentionally and are not summed as a unique total of batches.
- Read-only queries do not create receipts, change prescriptions, deduct stock or modify clinical records.

## Pending D7 Work

Shortage requests, doctor/billing notifications and stock recheck audit are implemented separately in [D7-stock-review.md](D7-stock-review.md). Invoice adjustments before collection and refunds with a financial audit trail still depend on the billing/payment module. Do not mark the whole D7 task complete yet.

## Verification

```powershell
dotnet build tests/Week2Verification/Week2Verification.csproj -o tmp/d7-inventory-verification
dotnet tmp/d7-inventory-verification/Week2Verification.dll --d7
npm.cmd --prefix frontend/clinic-management-client test
npm.cmd --prefix frontend/clinic-management-client run build
```

The `--d7` harness uses a unique temporary LocalDB database and deletes only that test database on exit. It never resets the developer's clinic database. `--d7-ui` keeps the temporary API alive until a newline is sent to stdin for browser verification.

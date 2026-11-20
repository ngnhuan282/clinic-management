using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Helpers;
using ClinicManagement.Services.Implementations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/admin-dashboard")]
[Authorize(Roles = RoleConstants.Admin)]
public class AdminDashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminDashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: /api/admin-dashboard/summary
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var now = DateTime.UtcNow.AddHours(7);
        var today = now.Date;
        var tomorrow = today.AddDays(1);
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var nextMonth = monthStart.AddMonths(1);

        var appointmentsToday = _context.Appointments
            .Where(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow);

        var completedToday = await appointmentsToday
            .CountAsync(a => a.Status == AppointmentStatusConstants.Completed);

        var inProgressToday = await appointmentsToday
            .CountAsync(a => a.Status == AppointmentStatusConstants.InProgress);

        var appointmentsThisMonth = _context.Appointments
            .Where(a => a.AppointmentDate >= monthStart && a.AppointmentDate < nextMonth);

        var completedThisMonth = await appointmentsThisMonth
            .CountAsync(a => a.Status == AppointmentStatusConstants.Completed);

        var monthlyRevenue = await ReadDailyRevenueAsync(monthStart, nextMonth);
        var revenueThisMonth = monthlyRevenue.Sum(x => x.TotalRevenue);
        var patientPaymentsThisMonth = monthlyRevenue.Sum(x => x.PatientPayments);
        var insurancePaymentsThisMonth = monthlyRevenue.Sum(x => x.InsurancePayments);

        var inventoryBatches = _context.Inventory.AsNoTracking();

        var totalStockQuantity = await inventoryBatches
            .SumAsync(i => (int?)i.QuantityInStock) ?? 0;

        var expiredBatches = await inventoryBatches
            .CountAsync(i => i.ExpiryDate < DateOnly.FromDateTime(today));

        var stockByMedicine = _context.Inventory
            .AsNoTracking()
            .GroupBy(i => new { i.MedicineId, i.Medicine.MedicineName, i.Medicine.Unit })
            .Select(g => new
            {
                g.Key.MedicineId,
                MedicineName = g.Key.MedicineName,
                Unit = g.Key.Unit,
                QuantityInStock = g.Sum(i => i.QuantityInStock)
            });

        var settings = await ClinicSettingsService.ReadSnapshotSafeAsync(_context);
        var lowStockThreshold = settings.LowStockThreshold > 0 ? settings.LowStockThreshold : 10;

        var lowStockMedicines = await stockByMedicine
            .Where(i => i.QuantityInStock <= lowStockThreshold)
            .CountAsync();

        return Ok(new
        {
            generatedAt = now,
            appointments = new { completedToday, inProgressToday, completedThisMonth },
            revenue = new { totalThisMonth = revenueThisMonth, patientPaymentsThisMonth, insurancePaymentsThisMonth },
            inventory = new { totalStockQuantity, lowStockMedicines, expiredBatches }
        });
    }

    // GET: /api/admin-dashboard/appointments?from=2026-11-01&to=2026-11-17
    [HttpGet("appointments")]
    public async Task<IActionResult> GetAppointments(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var now = ClinicClock.Today.ToDateTime(TimeOnly.MinValue);
        var startDate = (from ?? new DateTime(now.Year, now.Month, 1)).Date;
        var endDate = (to ?? now.Date).Date;

        if (!IsValidPeriod(startDate, endDate))
        {
            return BadRequest(new { message = "Chọn khoảng ngày hợp lệ, tối đa 366 ngày." });
        }

        var endExclusive = endDate.AddDays(1);

        var periodAppointments = _context.Appointments
            .AsNoTracking()
            .Where(a => a.AppointmentDate >= startDate && a.AppointmentDate < endExclusive);

        var totals = await periodAppointments
            .GroupBy(a => 1)
            .Select(g => new
            {
                TotalAppointments = g.Count(),
                CompletedCount = g.Count(a => a.Status == AppointmentStatusConstants.Completed),
                InProgressCount = g.Count(a => a.Status == AppointmentStatusConstants.InProgress),
                CancelledCount = g.Count(a => a.Status == AppointmentStatusConstants.Cancelled)
            })
            .FirstOrDefaultAsync();

        var dailyAppointments = await periodAppointments
            .GroupBy(a => a.AppointmentDate.Date)
            .Select(g => new
            {
                date = g.Key,
                totalAppointments = g.Count(),
                completedCount = g.Count(a => a.Status == AppointmentStatusConstants.Completed),
                inProgressCount = g.Count(a => a.Status == AppointmentStatusConstants.InProgress),
                cancelledCount = g.Count(a => a.Status == AppointmentStatusConstants.Cancelled)
            })
            .OrderBy(x => x.date)
            .ToListAsync();

        return Ok(new
        {
            from = startDate,
            to = endDate,
            summary = new
            {
                totalAppointments = totals?.TotalAppointments ?? 0,
                completedCount = totals?.CompletedCount ?? 0,
                inProgressCount = totals?.InProgressCount ?? 0,
                cancelledCount = totals?.CancelledCount ?? 0
            },
            dailyAppointments
        });
    }

    // GET: /api/admin-dashboard/revenue?from=2026-10-01&to=2026-10-31
    [HttpGet("revenue")]
    public async Task<IActionResult> GetRevenue(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var now = ClinicClock.Today.ToDateTime(TimeOnly.MinValue);
        var startDate = (from ?? new DateTime(now.Year, now.Month, 1)).Date;
        var endDate = (to ?? now.Date).Date;

        if (!IsValidPeriod(startDate, endDate))
        {
            return BadRequest(new { message = "Chọn khoảng ngày hợp lệ, tối đa 366 ngày." });
        }

        var dailyRevenue = await ReadDailyRevenueAsync(startDate, endDate.AddDays(1));

        return Ok(new
        {
            from = startDate,
            to = endDate,
            summary = new
            {
                invoiceCount = dailyRevenue.Sum(x => x.InvoiceCount),
                totalRevenue = dailyRevenue.Sum(x => x.TotalRevenue),
                patientPayments = dailyRevenue.Sum(x => x.PatientPayments),
                insurancePayments = dailyRevenue.Sum(x => x.InsurancePayments)
            },
            dailyRevenue
        });
    }

    private static bool IsValidPeriod(DateTime start, DateTime end) =>
        start.Year >= 2 && end < DateTime.MaxValue.Date && end >= start && (end - start).Days < 366;

    private sealed record DailyRevenue(DateTime Date, int InvoiceCount, decimal PatientPayments, decimal InsurancePayments)
    {
        public decimal TotalRevenue => PatientPayments + InsurancePayments;
    }

    private async Task<List<DailyRevenue>> ReadDailyRevenueAsync(DateTime start, DateTime endExclusive)
    {
        // Revenue dates follow the clinic calendar. Insurance is the amount recorded on accounting documents.
        var utcStart = start.AddHours(-7);
        var utcEnd = endExclusive.AddHours(-7);
        var receipts = await _context.InvoicePayments.AsNoTracking().Where(p => p.PaidAt >= utcStart && p.PaidAt < utcEnd)
            .GroupBy(p => p.PaidAt.AddHours(7).Date)
            .Select(g => new { Date = g.Key, Amount = g.Sum(p => p.PaymentType == "Refund" ? -p.Amount : p.Amount) })
            .ToListAsync();
        var documents = await _context.Invoices.AsNoTracking().Where(i => i.CreatedAt >= utcStart && i.CreatedAt < utcEnd)
            .GroupBy(i => i.CreatedAt.AddHours(7).Date)
            .Select(g => new
            {
                Date = g.Key, Count = g.Count(), Insurance = g.Sum(i => i.InsuranceAmount)
            }).ToListAsync();
        // PaidAmount can also include legacy receipts imported without line-by-line history.
        var legacy = await _context.Invoices.AsNoTracking().Where(i => i.CreatedAt >= utcStart && i.CreatedAt < utcEnd && i.PaidAmount != 0)
            .Select(i => new
            {
                Date = i.CreatedAt.AddHours(7).Date,
                Amount = i.PaidAmount - (i.Payments.Sum(p => (decimal?)(p.PaymentType == "Refund" ? -p.Amount : p.Amount)) ?? 0)
            }).Where(r => r.Amount != 0).ToListAsync();
        var legacyBooks = await _context.BookInvoices.AsNoTracking()
            .Where(b => b.PaidAt >= utcStart && b.PaidAt < utcEnd && !_context.InvoiceDetails.Any(d =>
                d.Invoice!.InvoiceType == "Standard" && d.Invoice.BillingStage == "Book"
                && (d.SourceType == "Book" && d.SourceId == b.BookInvoiceId || d.SourceType == "BookRequest"
                    && _context.PatientBookRequests.Any(r => r.PatientBookRequestId == d.SourceId && r.BookInvoiceId == b.BookInvoiceId))))
            .GroupBy(b => b.PaidAt!.Value.AddHours(7).Date)
            .Select(g => new { Date = g.Key, Amount = g.Sum(b => b.Amount), Count = g.Count() }).ToListAsync();

        return documents.Select(d => new DailyRevenue(d.Date, d.Count, 0, d.Insurance))
            .Concat(receipts.Select(p => new DailyRevenue(p.Date, 0, p.Amount, 0)))
            .Concat(legacy.Select(p => new DailyRevenue(p.Date, 0, p.Amount, 0)))
            .Concat(legacyBooks.Select(p => new DailyRevenue(p.Date, p.Count, p.Amount, 0)))
            .GroupBy(r => r.Date).OrderBy(g => g.Key)
            .Select(g => new DailyRevenue(g.Key, g.Sum(r => r.InvoiceCount), g.Sum(r => r.PatientPayments), g.Sum(r => r.InsurancePayments)))
            .ToList();
    }

    // GET: /api/admin-dashboard/inventory
    [HttpGet("inventory")]
    public async Task<IActionResult> GetInventory()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);

        var stockByMedicine = _context.Inventory
            .AsNoTracking()
            .GroupBy(i => new { i.MedicineId, i.Medicine.MedicineName, i.Medicine.Unit })
            .Select(g => new
            {
                medicineId = g.Key.MedicineId,
                medicineName = g.Key.MedicineName,
                unit = g.Key.Unit,
                quantityInStock = g.Sum(i => i.QuantityInStock),
                expiredQuantity = g
                    .Where(i => i.ExpiryDate < today)
                    .Sum(i => i.QuantityInStock),
                nearestExpiryDate = g.Min(i => i.ExpiryDate)
            });

        var medicines = await stockByMedicine
            .OrderBy(i => i.quantityInStock)
            .ThenBy(i => i.medicineName)
            .ToListAsync();

        var lowStock = medicines
            .Where(i => i.quantityInStock <= 10)
            .ToList();

        var expiredBatches = await _context.Inventory
            .AsNoTracking()
            .Where(i => i.ExpiryDate < today)
            .Select(i => new
            {
                i.InventoryId,
                i.MedicineId,
                medicineName = i.Medicine.MedicineName,
                i.BatchNumber,
                i.QuantityInStock,
                i.ExpiryDate
            })
            .OrderBy(i => i.ExpiryDate)
            .ToListAsync();

        return Ok(new
        {
            totalMedicinesInStock = medicines.Count(i => i.quantityInStock > 0),
            totalStockQuantity = medicines.Sum(i => i.quantityInStock),
            lowStockCount = lowStock.Count,
            expiredBatchCount = expiredBatches.Count,
            lowStock,
            expiredBatches,
            medicines
        });
    }
}

using ClinicManagement.Commons;
using ClinicManagement.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Controllers;

[ApiController]
[Route("api/admin-dashboard")]
[Authorize(Roles = "Admin")]
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
        var now = DateTime.Now;
        var today = now.Date;
        var tomorrow = today.AddDays(1);
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var nextMonth = monthStart.AddMonths(1);

        var appointmentsToday = _context.Appointments
            .Where(a => a.AppointmentDate >= today
                     && a.AppointmentDate < tomorrow);

        var completedToday = await appointmentsToday
            .CountAsync(a => a.Status == AppointmentStatusConstants.Completed);

        var inProgressToday = await appointmentsToday
            .CountAsync(a => a.Status == AppointmentStatusConstants.InProgress);

        var appointmentsThisMonth = _context.Appointments
            .Where(a => a.AppointmentDate >= monthStart
                     && a.AppointmentDate < nextMonth);

        var completedThisMonth = await appointmentsThisMonth
            .CountAsync(a => a.Status == AppointmentStatusConstants.Completed);

        var paidInvoicesThisMonth = _context.Invoices
            .Where(i => i.Status == "Paid"
                     && i.CreatedAt >= monthStart
                     && i.CreatedAt < nextMonth);

        var revenueThisMonth = await paidInvoicesThisMonth
            .SumAsync(i => (decimal?)i.TotalAmount) ?? 0m;

        var patientPaymentsThisMonth = await paidInvoicesThisMonth
            .SumAsync(i => (decimal?)i.PatientAmount) ?? 0m;

        var insurancePaymentsThisMonth = await paidInvoicesThisMonth
            .SumAsync(i => (decimal?)i.InsuranceAmount) ?? 0m;

        var inventoryBatches = _context.Inventory.AsNoTracking();

        var totalStockQuantity = await inventoryBatches
            .SumAsync(i => (int?)i.QuantityInStock) ?? 0;

        var expiredBatches = await inventoryBatches
            .CountAsync(i => i.ExpiryDate < DateOnly.FromDateTime(today));

        var stockByMedicine = _context.Inventory
            .AsNoTracking()
            .GroupBy(i => new
            {
                i.MedicineId,
                i.Medicine.MedicineName,
                i.Medicine.Unit
            })
            .Select(g => new
            {
                g.Key.MedicineId,
                MedicineName = g.Key.MedicineName,
                Unit = g.Key.Unit,
                QuantityInStock = g.Sum(i => i.QuantityInStock)
            });

        var lowStockMedicines = await stockByMedicine
            .Where(i => i.QuantityInStock <= 10)
            .CountAsync();

        return Ok(new
        {
            generatedAt = now,
            appointments = new
            {
                completedToday,
                inProgressToday,
                completedThisMonth
            },
            revenue = new
            {
                totalThisMonth = revenueThisMonth,
                patientPaymentsThisMonth,
                insurancePaymentsThisMonth
            },
            inventory = new
            {
                totalStockQuantity,
                lowStockMedicines,
                expiredBatches
            }
        });
    }

    // GET: /api/admin-dashboard/revenue?from=2026-10-01&to=2026-10-31
    [HttpGet("revenue")]
    public async Task<IActionResult> GetRevenue(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var now = DateTime.Now;
        var startDate = (from ?? new DateTime(now.Year, now.Month, 1)).Date;
        var endDate = (to ?? now.Date).Date;

        if (endDate < startDate)
        {
            return BadRequest(new
            {
                message = "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu."
            });
        }

        var endExclusive = endDate.AddDays(1);

        var paidInvoices = _context.Invoices
            .AsNoTracking()
            .Where(i => i.Status == "Paid"
                     && i.CreatedAt >= startDate
                     && i.CreatedAt < endExclusive);

        var totals = await paidInvoices
            .GroupBy(i => 1)
            .Select(g => new
            {
                InvoiceCount = g.Count(),
                TotalRevenue = g.Sum(i => i.TotalAmount),
                PatientPayments = g.Sum(i => i.PatientAmount),
                InsurancePayments = g.Sum(i => i.InsuranceAmount)
            })
            .FirstOrDefaultAsync();

        var dailyRevenue = await paidInvoices
            .GroupBy(i => i.CreatedAt.Date)
            .Select(g => new
            {
                date = g.Key,
                invoiceCount = g.Count(),
                totalRevenue = g.Sum(i => i.TotalAmount),
                patientPayments = g.Sum(i => i.PatientAmount),
                insurancePayments = g.Sum(i => i.InsuranceAmount)
            })
            .OrderBy(x => x.date)
            .ToListAsync();

        return Ok(new
        {
            from = startDate,
            to = endDate,
            summary = new
            {
                invoiceCount = totals?.InvoiceCount ?? 0,
                totalRevenue = totals?.TotalRevenue ?? 0m,
                patientPayments = totals?.PatientPayments ?? 0m,
                insurancePayments = totals?.InsurancePayments ?? 0m
            },
            dailyRevenue
        });
    }

    // GET: /api/admin-dashboard/inventory
    [HttpGet("inventory")]
    public async Task<IActionResult> GetInventory()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);

        var stockByMedicine = _context.Inventory
            .AsNoTracking()
            .GroupBy(i => new
            {
                i.MedicineId,
                i.Medicine.MedicineName,
                i.Medicine.Unit
            })
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

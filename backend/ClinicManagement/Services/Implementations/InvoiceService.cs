using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Invoices;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations
{
    public class InvoiceService : IInvoiceService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notifications;

        public InvoiceService(ApplicationDbContext context, INotificationService notifications)
        {
            _context = context;
            _notifications = notifications;
        }

        public async Task<List<PendingAppointmentBillingDto>> GetPendingBillingsAsync(string stage)
{
    var result = new List<PendingAppointmentBillingDto>();

    if (stage == "Pending")
    {
        // 1. Lấy danh sách ID Appointment đã xuất hóa đơn
        var paidAppointmentIds = await _context.InvoiceDetails
            .Where(d => d.SourceType == "Appointment")
            .Select(d => d.SourceId)
            .Distinct()
            .ToListAsync();

        // 2. Lọc danh sách Appointment chưa thanh toán trực tiếp từ Database
        var pendingAppointments = await _context.Set<Appointment>()
            .Where(a => !paidAppointmentIds.Contains(a.AppointmentId))
            .ToListAsync();

        foreach (var app in pendingAppointments)
        {
            result.Add(new PendingAppointmentBillingDto
            {
                AppointmentId = app.AppointmentId,
                PatientId = app.PatientId ?? 0,
                BillingStage = "Pending",
                Items = new List<PendingBillingItemDto>
                {
                    new PendingBillingItemDto
                    {
                        SourceType = "Appointment",
                        SourceId = app.AppointmentId,
                        ItemName = "Phí khám ban đầu",
                        UnitPrice = 150000,
                        Quantity = 1,
                        TotalPrice = 150000
                    }
                }
            });
        }
    }
    else if (stage == "LabAndConsultation")
    {
        // 1. Lấy danh sách ID LabTest đã xuất hóa đơn
        var paidLabTestIds = await _context.InvoiceDetails
            .Where(d => d.SourceType == "LabTest")
            .Select(d => d.SourceId)
            .Distinct()
            .ToListAsync();

        // 2. Lọc các LabTest chưa thanh toán trực tiếp từ Database
        var pendingLabTests = await _context.LabTests
            .Include(l => l.LabTestType)
            .Where(l => !paidLabTestIds.Contains(l.Id))
            .ToListAsync();

        var groupedByPatient = pendingLabTests.GroupBy(l => l.PatientId);

        foreach (var group in groupedByPatient)
        {
            var items = group.Select(l => new PendingBillingItemDto
            {
                SourceType = "LabTest",
                SourceId = l.Id,
                ItemName = l.LabTestType?.Name ?? "Xét nghiệm",
                UnitPrice = l.LabTestType?.Price ?? 0,
                Quantity = 1,
                TotalPrice = l.LabTestType?.Price ?? 0
            }).ToList();

            result.Add(new PendingAppointmentBillingDto
            {
                AppointmentId = 0, // Gom nhóm theo PatientId
                PatientId = group.Key,
                BillingStage = "LabAndConsultation",
                Items = items
            });
        }
    }

    return result;
}

        public async Task<InvoiceResponseDto> CreateInvoiceAsync(int cashierId, CreateInvoiceDto dto)
        {
            await using var transaction = dto.BillingStage == "Book"
                ? await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable) : null;
            // Kiểm tra chống thu trùng (Duplicate Check via SourceType + SourceId)
            foreach (var item in dto.Items)
            {
                bool isAlreadyPaid = await _context.InvoiceDetails
                    .AnyAsync(d => d.SourceType == item.SourceType && d.SourceId == item.SourceId);

                if (isAlreadyPaid)
                {
                    throw new InvalidOperationException($"Khoản phí '{item.ItemName}' (Mã: {item.SourceId}) đã được thanh toán trước đó!");
                }
            }

            var invoice = new Invoice
            {
                AppointmentId = dto.AppointmentId,
                PatientId = dto.PatientId,
                CashierId = cashierId,
                BillingStage = dto.BillingStage,
                PaymentMethod = dto.PaymentMethod,
                Status = "Paid",
                CreatedAt = DateTime.UtcNow,
                TotalAmount = dto.Items.Sum(x => x.UnitPrice * x.Quantity)
            };

            foreach (var item in dto.Items)
            {
                invoice.InvoiceDetails.Add(new InvoiceDetail
                {
                    SourceType = item.SourceType,
                    SourceId = item.SourceId,
                    ItemName = item.ItemName,
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity,
                    TotalPrice = item.UnitPrice * item.Quantity
                });
            }

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            if (invoice.BillingStage == "Book" && invoice.Status == "Paid")
            {
                var rows = await _notifications.StageAsync(await _notifications.ReceptionRecipientsAsync(),
                    $"invoice:{invoice.Id}:book-paid", "Billing", "Tiền sổ đã thanh toán",
                    $"Hóa đơn Book #{invoice.Id} đã thanh toán. Lễ tân có thể xử lý cấp sổ.");
                await _context.SaveChangesAsync();
                await transaction!.CommitAsync();
                await _notifications.PublishAsync(rows);
            }

            return (await GetInvoiceByIdAsync(invoice.Id))!;
        }

        public async Task<InvoiceResponseDto?> GetInvoiceByIdAsync(int id)
        {
            var inv = await _context.Invoices
                .Include(i => i.InvoiceDetails)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (inv == null) return null;

            return new InvoiceResponseDto
            {
                Id = inv.Id,
                AppointmentId = inv.AppointmentId,
                PatientId = inv.PatientId,
                CashierId = inv.CashierId,
                BillingStage = inv.BillingStage,
                TotalAmount = inv.TotalAmount,
                PaymentMethod = inv.PaymentMethod,
                Status = inv.Status,
                CreatedAt = inv.CreatedAt,
                Details = inv.InvoiceDetails.Select(d => new InvoiceDetailResponseDto
                {
                    Id = d.Id, // Sửa lại thành d.Id
                    SourceType = d.SourceType,
                    SourceId = d.SourceId,
                    ItemName = d.ItemName,
                    UnitPrice = d.UnitPrice,
                    Quantity = d.Quantity,
                    TotalPrice = d.TotalPrice
                }).ToList()
            };
        }
    }
}

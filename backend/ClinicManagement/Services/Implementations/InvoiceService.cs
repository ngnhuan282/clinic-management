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

        public InvoiceService(ApplicationDbContext context)
        {
            _context = context;
        }

       public async Task<List<PendingAppointmentBillingDto>> GetPendingBillingsAsync(string stage)
{
    var result = new List<PendingAppointmentBillingDto>();

    if (stage == "Pending")
    {
        // 1. Lấy danh sách AppointmentId đã xuất hóa đơn "Appointment"
        var paidAppointmentIds = await _context.InvoiceDetails
            .Where(d => d.SourceType == "Appointment")
            .Select(d => d.SourceId)
            .Distinct()
            .ToListAsync();

        // 2. Lấy danh sách Appointment chưa thanh toán phí khám ban đầu
        var pendingAppointments = await _context.Appointments
            .Where(a => !paidAppointmentIds.Contains(a.AppointmentId))
            .ToListAsync();

        foreach (var app in pendingAppointments)
        {
            decimal examinationFee = 150000;

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
                        UnitPrice = examinationFee,
                        Quantity = 1,
                        TotalPrice = examinationFee
                    }
                }
            });
        }
    }
    else if (stage == "LabAndConsultation")
    {
        // 1. Lấy danh sách LabTest.Id đã được xuất hóa đơn "LabTest"
        var paidLabTestIds = await _context.InvoiceDetails
            .Where(d => d.SourceType == "LabTest")
            .Select(d => d.SourceId)
            .Distinct()
            .ToListAsync();

        // 2. Lấy các LabTest có Status == "Completed" VÀ chưa nằm trong InvoiceDetails
        var pendingLabTests = await _context.LabTests
            .Include(l => l.LabTestType)
            .Where(l => l.Status == "Completed" && !paidLabTestIds.Contains(l.Id))
            .ToListAsync();

        // 3. Gom nhóm danh sách xét nghiệm theo PatientId
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
                AppointmentId = 0, // Nhóm theo bệnh nhân (chờ thu tiền các xét nghiệm đã hoàn thành)
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
        // Nếu AppointmentId <= 0 (như trường hợp LabAndConsultation = 0), gán null để không vi phạm khóa ngoại SQL
        AppointmentId = (dto.AppointmentId.HasValue && dto.AppointmentId.Value > 0) ? dto.AppointmentId.Value : null,
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
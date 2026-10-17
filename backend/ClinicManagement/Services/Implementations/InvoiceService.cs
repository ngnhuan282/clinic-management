using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Invoices;
using ClinicManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class InvoiceService(
    ApplicationDbContext context,
    INotificationService notifications) : IInvoiceService
{
    public async Task<List<PendingAppointmentBillingDto>> GetPendingBillingsAsync(string stage)
    {
        var result = new List<PendingAppointmentBillingDto>();

        if (stage == "Pending")
        {
            var billedAppointments = await context.InvoiceDetails
                .Where(detail => detail.SourceType == "Appointment")
                .Select(detail => detail.SourceId)
                .Distinct()
                .ToListAsync();

            const decimal examinationFee = 150000m;
            var appointments = await context.Appointments
                .Where(appointment => !billedAppointments.Contains(appointment.AppointmentId))
                .ToListAsync();

            result.AddRange(appointments.Select(appointment => new PendingAppointmentBillingDto
            {
                AppointmentId = appointment.AppointmentId,
                PatientId = appointment.PatientId ?? 0,
                BillingStage = "Pending",
                Items =
                [
                    new PendingBillingItemDto
                    {
                        SourceType = "Appointment",
                        SourceId = appointment.AppointmentId,
                        ItemName = "Phí khám ban đầu",
                        UnitPrice = examinationFee,
                        Quantity = 1,
                        TotalPrice = examinationFee
                    }
                ]
            }));
        }
        else if (stage == "LabAndConsultation")
        {
            var billedLabTests = await context.InvoiceDetails
                .Where(detail => detail.SourceType == "LabTest")
                .Select(detail => detail.SourceId)
                .Distinct()
                .ToListAsync();

            var labTests = await context.LabTests
                .Include(test => test.LabTestType)
                .Where(test => test.Status == "Pending" && !billedLabTests.Contains(test.Id))
                .ToListAsync();

            foreach (var group in labTests.GroupBy(test => test.PatientId))
            {
                var items = group.Select(test => new PendingBillingItemDto
                {
                    SourceType = "LabTest",
                    SourceId = test.Id,
                    ItemName = test.LabTestType?.Name ?? "Xét nghiệm",
                    UnitPrice = test.LabTestType?.Price ?? 0m,
                    Quantity = 1,
                    TotalPrice = test.LabTestType?.Price ?? 0m
                }).ToList();

                result.Add(new PendingAppointmentBillingDto
                {
                    AppointmentId = 0,
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
        ArgumentNullException.ThrowIfNull(dto);
        if (dto.Items is not { Count: > 0 })
            throw new InvalidOperationException("Hóa đơn phải có ít nhất một khoản mục.");

        await using var transaction = dto.BillingStage == "Book"
            ? await context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable)
            : null;

        foreach (var item in dto.Items)
        {
            if (await context.InvoiceDetails.AnyAsync(detail =>
                    detail.SourceType == item.SourceType && detail.SourceId == item.SourceId))
            {
                throw new InvalidOperationException(
                    $"Khoản phí '{item.ItemName}' (Mã: {item.SourceId}) đã được thanh toán trước đó!");
            }
        }

        var bookSourceIds = dto.Items
            .Where(item => item.SourceType == "Book")
            .Select(item => item.SourceId)
            .Distinct()
            .ToArray();

        var bookInvoices = dto.BillingStage == "Book"
            ? await context.BookInvoices
                .Where(invoice => bookSourceIds.Contains(invoice.BookInvoiceId))
                .ToListAsync()
            : [];

        foreach (var bookInvoice in bookInvoices)
        {
            if (bookInvoice.PatientId != dto.PatientId || bookInvoice.Status != "Unpaid")
                throw new InvalidOperationException("Hóa đơn sổ không thuộc bệnh nhân hoặc đã được thanh toán.");

            var sources = dto.Items
                .Where(item => item.SourceType == "Book" && item.SourceId == bookInvoice.BookInvoiceId)
                .ToList();
            if (sources.Count != 1 || sources[0].Quantity != 1 || sources[0].UnitPrice != bookInvoice.Amount)
                throw new InvalidOperationException("Số tiền thanh toán phải khớp phí trên hóa đơn sổ.");

            bookInvoice.Status = "Paid";
            bookInvoice.PaidAt = DateTime.UtcNow;
        }

        var totalAmount = dto.Items.Sum(item => item.UnitPrice * item.Quantity);
        var discountPercent = Math.Clamp(dto.InsuranceDiscountPercent, 0m, 100m);
        var insuranceAmount = Math.Round(totalAmount * discountPercent / 100m);
        var patientAmount = totalAmount - insuranceAmount;

        var invoice = new Invoice
        {
            AppointmentId = dto.AppointmentId is > 0 ? dto.AppointmentId : null,
            PatientId = dto.PatientId,
            CashierId = cashierId,
            BillingStage = dto.BillingStage,
            PaymentMethod = dto.PaymentMethod,
            Status = "Paid",
            CreatedAt = DateTime.UtcNow,
            TotalAmount = totalAmount,
            InsuranceDiscountPercent = discountPercent,
            InsuranceAmount = insuranceAmount,
            PatientAmount = patientAmount
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

        context.Invoices.Add(invoice);
        await context.SaveChangesAsync();

        if (invoice.BillingStage == "Book")
        {
            var notificationsToPublish = await notifications.StageAsync(
                await notifications.ReceptionRecipientsAsync(),
                $"invoice:{invoice.Id}:book-paid",
                "Billing",
                "Tiền sổ đã thanh toán",
                $"Hóa đơn Book #{invoice.Id} đã thanh toán. Lễ tân có thể xử lý cấp sổ.");

            await context.SaveChangesAsync();
            await transaction!.CommitAsync();

            await notifications.PublishAsync(notificationsToPublish);
            foreach (var bookInvoice in bookInvoices)
                await notifications.PublishBookInvoiceChangedAsync(bookInvoice);
            if (bookInvoices.Count == 0)
                await notifications.PublishBookPaymentAsync(invoice);
        }

        return (await GetInvoiceByIdAsync(invoice.Id))!;
    }

    public async Task<InvoiceResponseDto?> GetInvoiceByIdAsync(int id)
    {
        var invoice = await context.Invoices
            .AsNoTracking()
            .Include(item => item.InvoiceDetails)
            .FirstOrDefaultAsync(item => item.Id == id);
        return invoice is null ? null : MapInvoice(invoice);
    }

    public async Task<IEnumerable<InvoiceResponseDto>> GetInvoiceHistoryAsync(string? searchKeyword)
    {
        var query = context.Invoices.AsNoTracking().Include(invoice => invoice.InvoiceDetails).AsQueryable();
        if (!string.IsNullOrWhiteSpace(searchKeyword))
        {
            var keyword = searchKeyword.Trim();
            var isNumber = int.TryParse(keyword, out var id);
            query = query.Where(invoice =>
                invoice.InvoiceDetails.Any(detail => detail.ItemName.Contains(keyword) || detail.SourceType.Contains(keyword)) ||
                invoice.Status.Contains(keyword) ||
                invoice.BillingStage.Contains(keyword) ||
                invoice.PaymentMethod.Contains(keyword) ||
                (isNumber && (invoice.Id == id || invoice.PatientId == id || invoice.AppointmentId == id)));
        }

        var invoices = await query.OrderByDescending(invoice => invoice.CreatedAt)
            .ThenByDescending(invoice => invoice.Id)
            .ToListAsync();
        return invoices.Select(MapInvoice).ToList();
    }

    public async Task<InvoiceResponseDto> CreateAdjustmentInvoiceAsync(int cashierId, CreateAdjustmentInvoiceDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        if (dto.OriginalInvoiceId <= 0)
            throw new InvalidOperationException("Mã hóa đơn gốc không hợp lệ.");
        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new InvalidOperationException("Vui lòng nhập lý do điều chỉnh hóa đơn.");
        if (dto.Items is not { Count: > 0 })
            throw new InvalidOperationException("Hóa đơn điều chỉnh phải có ít nhất một khoản mục.");
        if (dto.Items.Sum(item => item.UnitPrice * item.Quantity) != dto.AdjustmentTotalAmount)
            throw new InvalidOperationException("Tổng tiền điều chỉnh không khớp tổng các khoản mục.");
        if (dto.AdjustmentTotalAmount != dto.AdjustmentInsuranceAmount + dto.AdjustmentPatientAmount)
            throw new InvalidOperationException("Tổng tiền điều chỉnh phải bằng tiền bảo hiểm cộng tiền điều chỉnh của bệnh nhân.");

        await using var transaction = await context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var original = await context.Invoices
            .Include(invoice => invoice.InvoiceDetails)
            .FirstOrDefaultAsync(invoice => invoice.Id == dto.OriginalInvoiceId)
            ?? throw new InvalidOperationException("Không tìm thấy hóa đơn gốc.");
        if (original.InvoiceType == "Adjustment")
            throw new InvalidOperationException("Không thể tạo chứng từ điều chỉnh từ một hóa đơn điều chỉnh.");

        var adjustment = new Invoice
        {
            AppointmentId = original.AppointmentId,
            PatientId = original.PatientId,
            CashierId = cashierId,
            BillingStage = original.BillingStage,
            InvoiceType = "Adjustment",
            OriginalInvoiceId = original.Id,
            PaymentMethod = dto.PaymentMethod,
            Status = "Paid",
            CreatedAt = DateTime.UtcNow,
            TotalAmount = dto.AdjustmentTotalAmount,
            InsuranceAmount = dto.AdjustmentInsuranceAmount,
            PatientAmount = dto.AdjustmentPatientAmount
        };

        foreach (var item in dto.Items)
        {
            adjustment.InvoiceDetails.Add(new InvoiceDetail
            {
                SourceType = item.SourceType,
                SourceId = item.SourceId,
                ItemName = item.ItemName,
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity,
                TotalPrice = item.UnitPrice * item.Quantity
            });
        }
        adjustment.InvoiceDetails.Add(new InvoiceDetail
        {
            SourceType = "AdjustmentReason",
            SourceId = original.Id,
            ItemName = $"Lý do điều chỉnh: {dto.Reason.Trim()}",
            UnitPrice = 0m,
            Quantity = 1,
            TotalPrice = 0m
        });

        context.Invoices.Add(adjustment);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return (await GetInvoiceByIdAsync(adjustment.Id))!;
    }

    private static InvoiceResponseDto MapInvoice(Invoice invoice) => new()
    {
        Id = invoice.Id,
        AppointmentId = invoice.AppointmentId,
        PatientId = invoice.PatientId,
        CashierId = invoice.CashierId,
        BillingStage = invoice.BillingStage,
        TotalAmount = invoice.TotalAmount,
        InsuranceDiscountPercent = invoice.InsuranceDiscountPercent,
        InsuranceAmount = invoice.InsuranceAmount,
        PatientAmount = invoice.PatientAmount,
        PaymentMethod = invoice.PaymentMethod,
        Status = invoice.Status,
        CreatedAt = invoice.CreatedAt,
        Details = invoice.InvoiceDetails.Select(detail => new InvoiceDetailResponseDto
        {
            Id = detail.Id,
            SourceType = detail.SourceType,
            SourceId = detail.SourceId,
            ItemName = detail.ItemName,
            UnitPrice = detail.UnitPrice,
            Quantity = detail.Quantity,
            TotalPrice = detail.TotalPrice
        }).ToList()
    };
}

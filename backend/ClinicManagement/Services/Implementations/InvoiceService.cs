using System.Data;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Invoices;
using ClinicManagement.Exceptions;
using ClinicManagement.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public class InvoiceService(
    ApplicationDbContext context,
    INotificationService notifications) : IInvoiceService
{
    private const decimal DefaultExaminationFee = 150000m;
    private const decimal DefaultBookFee = 20000m;

    public async Task<List<PendingAppointmentBillingDto>> GetPendingBillingsAsync(string stage)
    {
        var normalizedStage = string.IsNullOrWhiteSpace(stage) ? "Pending" : stage.Trim();

        // Lấy danh sách các khoản đã được lập hóa đơn (Standard)
        var billedSources = await context.InvoiceDetails
            .AsNoTracking()
            .Where(d => d.Invoice != null && d.Invoice.InvoiceType == "Standard")
            .Select(d => new { d.SourceType, d.SourceId })
            .ToListAsync();

        var billedSet = billedSources
            .Select(x => $"{x.SourceType}:{x.SourceId}")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        bool IsBilled(string type, int id) => billedSet.Contains($"{type}:{id}");

        // Bản đồ thông tin bệnh nhân (hỗ trợ cả UserId và PatientProfileId)
        var patients = await context.Patients.AsNoTracking().ToListAsync();
        var users = await context.Users.AsNoTracking().ToListAsync();
        var patientById = patients.ToDictionary(p => p.PatientId);
        var patientByUserId = patients
            .Where(p => p.UserId.HasValue)
            .GroupBy(p => p.UserId!.Value)
            .ToDictionary(g => g.Key, g => g.First());
        var userById = users.ToDictionary(u => u.UserId);

        (string Name, string Phone) ResolvePatientInfo(int id, string? fallbackName = null, string? fallbackPhone = null)
        {
            if (patientByUserId.TryGetValue(id, out var pByUser))
                return (pByUser.FullName, pByUser.Phone);
            if (patientById.TryGetValue(id, out var pById))
                return (pById.FullName, pById.Phone);
            if (userById.TryGetValue(id, out var u))
                return (u.FullName, u.Phone ?? fallbackPhone ?? string.Empty);
            return (fallbackName ?? $"Bệnh nhân #{id}", fallbackPhone ?? string.Empty);
        }

        // Quy đổi UserId <-> PatientProfileId để khớp LabTest với đúng Appointment
        int ResolveCanonicalBillingPatientId(Appointment app) =>
            app.MedicalRecord?.PatientId ?? app.PatientId ?? app.PatientProfileId ?? 0;

        List<int> GetEquivalentPatientIds(int rawId)
        {
            var ids = new HashSet<int> { rawId };
            if (patientById.TryGetValue(rawId, out var p) && p.UserId.HasValue)
                ids.Add(p.UserId.Value);
            if (patientByUserId.TryGetValue(rawId, out var p2))
                ids.Add(p2.PatientId);
            return ids.ToList();
        }

        var result = new List<PendingAppointmentBillingDto>();

        // =========================================================================
        // 1. SỔ TIỀN SỔ KHÁM BỆNH (VII.2: Lấy từ PatientBookRequest / BookInvoice)
        // =========================================================================
        if (normalizedStage == "Book")
        {
            var openRequests = await context.PatientBookRequests
                .AsNoTracking()
                .Include(r => r.Patient)
                .Include(r => r.BookInvoice)
                .Where(r => r.BookInvoiceId == null || r.BookInvoice!.Status == "Unpaid")
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();

            foreach (var req in openRequests)
            {
                var sourceType = req.BookInvoiceId.HasValue ? "Book" : "BookRequest";
                var sourceId = req.BookInvoiceId ?? req.PatientBookRequestId;
                if (IsBilled(sourceType, sourceId)) continue;

                var amount = req.BookInvoice?.Amount ?? DefaultBookFee;
                var reasonLabel = req.Reason switch
                {
                    "Lost" => "Cấp lại sổ khám (mất sổ)",
                    "Replaced" => "Đổi sổ khám mới",
                    _ => "Cấp sổ khám bệnh lần đầu"
                };

                result.Add(new PendingAppointmentBillingDto
                {
                    AppointmentId = 0,
                    PatientId = req.PatientId,
                    PatientName = req.Patient.FullName,
                    PatientPhone = req.Patient.Phone,
                    BillingStage = "Book",
                    TotalAmount = amount,
                    Items =
                    [
                        new PendingBillingItemDto
                        {
                            SourceType = sourceType,
                            SourceId = sourceId,
                            ItemName = $"{reasonLabel} (Yêu cầu #{req.PatientBookRequestId})",
                            UnitPrice = amount,
                            Quantity = 1,
                            TotalPrice = amount
                        }
                    ]
                });
            }

            // Bổ sung các BookInvoice Unpaid được tạo lẻ chưa gắn PatientBookRequest
            var linkedBookInvoiceIds = openRequests
                .Where(r => r.BookInvoiceId.HasValue)
                .Select(r => r.BookInvoiceId!.Value)
                .ToHashSet();

            var standaloneBookInvoices = await context.BookInvoices
                .AsNoTracking()
                .Include(b => b.Patient)
                .Where(b => b.Status == "Unpaid" && !linkedBookInvoiceIds.Contains(b.BookInvoiceId))
                .ToListAsync();

            foreach (var bi in standaloneBookInvoices)
            {
                if (IsBilled("Book", bi.BookInvoiceId)) continue;
                result.Add(new PendingAppointmentBillingDto
                {
                    AppointmentId = 0,
                    PatientId = bi.PatientId,
                    PatientName = bi.Patient.FullName,
                    PatientPhone = bi.Patient.Phone,
                    BillingStage = "Book",
                    TotalAmount = bi.Amount,
                    Items =
                    [
                        new PendingBillingItemDto
                        {
                            SourceType = "Book",
                            SourceId = bi.BookInvoiceId,
                            ItemName = $"Phí cấp sổ khám bệnh (#{bi.BookInvoiceId})",
                            UnitPrice = bi.Amount,
                            Quantity = 1,
                            TotalPrice = bi.Amount
                        }
                    ]
                });
            }

            return result;
        }

        // =========================================================================
        // 2. SỔ PHÍ KHÁM BAN ĐẦU (Pending)
        // =========================================================================
        if (normalizedStage == "Pending")
        {
            var appointments = await context.Appointments
                .AsNoTracking()
                .Include(a => a.Doctor)
                .Include(a => a.MedicalRecord)
                .Where(a => a.Status != AppointmentStatusConstants.Cancelled)
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();

            foreach (var app in appointments)
            {
                if (IsBilled("Appointment", app.AppointmentId)) continue;
                var billingPatientId = ResolveCanonicalBillingPatientId(app);
                var (pName, pPhone) = ResolvePatientInfo(billingPatientId, app.PatientName, app.PatientPhone);

                result.Add(new PendingAppointmentBillingDto
                {
                    AppointmentId = app.AppointmentId,
                    PatientId = billingPatientId,
                    PatientName = pName,
                    PatientPhone = pPhone,
                    BillingStage = "Pending",
                    TotalAmount = DefaultExaminationFee,
                    Items =
                    [
                        new PendingBillingItemDto
                        {
                            SourceType = "Appointment",
                            SourceId = app.AppointmentId,
                            ItemName = $"Phí khám chuyên khoa - BS. {app.Doctor?.FullName ?? "Khám bệnh"}",
                            UnitPrice = DefaultExaminationFee,
                            Quantity = 1,
                            TotalPrice = DefaultExaminationFee
                        }
                    ]
                });
            }

            return result;
        }

        // =========================================================================
        // 3. SỔ KHÁM VÀ XÉT NGHIỆM (VII.3: Ghép phí khám chưa thu của đúng AppointmentId)
        // =========================================================================
        if (normalizedStage == "LabAndConsultation")
        {
            var unbilledLabTests = await context.LabTests
                .AsNoTracking()
                .Include(t => t.LabTestType)
                .Where(t => t.Status != "Cancelled")
                .ToListAsync();

            unbilledLabTests = unbilledLabTests
                .Where(t => !IsBilled("LabTest", t.Id))
                .ToList();

            var appointments = await context.Appointments
                .AsNoTracking()
                .Include(a => a.Doctor)
                .Include(a => a.MedicalRecord)
                .Where(a => a.Status != AppointmentStatusConstants.Cancelled)
                .ToListAsync();

            // Gom xét nghiệm theo lượt khám gần nhất trong ngày của bệnh nhân
            var groupedByVisit = new Dictionary<(int AppointmentId, int BillingPatientId), List<LabTest>>();

            foreach (var test in unbilledLabTests)
            {
                var eqIds = GetEquivalentPatientIds(test.PatientId);
                var matchedApp = appointments
                    .Where(a =>
                        (a.PatientId.HasValue && eqIds.Contains(a.PatientId.Value)) ||
                        (a.PatientProfileId.HasValue && eqIds.Contains(a.PatientProfileId.Value)))
                    .OrderBy(a => Math.Abs((a.AppointmentDate.Date - test.CreatedAt.Date).TotalDays))
                    .ThenByDescending(a => a.AppointmentId)
                    .FirstOrDefault();

                var appId = matchedApp?.AppointmentId ?? 0;
                var billingPid = matchedApp != null ? ResolveCanonicalBillingPatientId(matchedApp) : test.PatientId;
                var key = (appId, billingPid);

                if (!groupedByVisit.TryGetValue(key, out var list))
                {
                    list = [];
                    groupedByVisit[key] = list;
                }
                list.Add(test);
            }

            foreach (var ((appId, billingPid), tests) in groupedByVisit)
            {
                var items = new List<PendingBillingItemDto>();
                var app = appId > 0 ? appointments.FirstOrDefault(a => a.AppointmentId == appId) : null;

                // Nếu lượt khám này chưa thu phí khám -> tự động ghép vào hóa đơn Khám + Xét nghiệm
                if (app != null && !IsBilled("Appointment", app.AppointmentId))
                {
                    items.Add(new PendingBillingItemDto
                    {
                        SourceType = "Appointment",
                        SourceId = app.AppointmentId,
                        ItemName = $"Phí khám chuyên khoa - BS. {app.Doctor?.FullName ?? "Khám bệnh"}",
                        UnitPrice = DefaultExaminationFee,
                        Quantity = 1,
                        TotalPrice = DefaultExaminationFee
                    });
                }

                items.AddRange(tests.Select(t => new PendingBillingItemDto
                {
                    SourceType = "LabTest",
                    SourceId = t.Id,
                    ItemName = t.LabTestType?.Name ?? $"Xét nghiệm #{t.Id}",
                    UnitPrice = t.LabTestType?.Price ?? 0m,
                    Quantity = 1,
                    TotalPrice = t.LabTestType?.Price ?? 0m
                }));

                var (pName, pPhone) = ResolvePatientInfo(billingPid, app?.PatientName, app?.PatientPhone);
                result.Add(new PendingAppointmentBillingDto
                {
                    AppointmentId = appId,
                    PatientId = billingPid,
                    PatientName = pName,
                    PatientPhone = pPhone,
                    BillingStage = "LabAndConsultation",
                    TotalAmount = items.Sum(i => i.TotalPrice),
                    Items = items
                });
            }

            return result;
        }

        // =========================================================================
        // 4. SỔ ĐƠN THUỐC ĐÃ CHỐT (VII.4: Medicine)
        // =========================================================================
        if (normalizedStage == "Medicine")
        {
            var prescriptions = await context.Prescriptions
                .AsNoTracking()
                .Include(p => p.MedicalRecord)
                    .ThenInclude(mr => mr.Appointment)
                .Include(p => p.Details)
                    .ThenInclude(d => d.Medicine)
                .Where(p => p.Status == PrescriptionStatusConstants.Issued)
                .OrderByDescending(p => p.PrescriptionDate)
                .ToListAsync();

            foreach (var rx in prescriptions)
            {
                if (IsBilled("Prescription", rx.PrescriptionId)) continue;
                if (rx.Details.Count == 0) continue;

                var app = rx.MedicalRecord.Appointment;
                var billingPid = ResolveCanonicalBillingPatientId(app);
                var (pName, pPhone) = ResolvePatientInfo(billingPid, app.PatientName, app.PatientPhone);

                var items = rx.Details.Select(d => new PendingBillingItemDto
                {
                    SourceType = "PrescriptionDetail",
                    SourceId = d.PrescriptionDetailId,
                    ItemName = $"{d.Medicine.MedicineName} ({d.Medicine.Unit})",
                    UnitPrice = d.Medicine.UnitPrice,
                    Quantity = d.Quantity,
                    TotalPrice = d.Medicine.UnitPrice * d.Quantity
                }).ToList();

                // Thêm dòng đại diện PrescriptionId = 0đ hoặc dùng Prescription làm khóa đối soát nếu cần,
                // ở đây dùng PrescriptionDetail khớp trực tiếp với FindInvoice của DispensingService!
                var allDetailsBilled = items.All(i => IsBilled("PrescriptionDetail", i.SourceId));
                if (allDetailsBilled) continue;

                result.Add(new PendingAppointmentBillingDto
                {
                    AppointmentId = app.AppointmentId,
                    PatientId = billingPid,
                    PatientName = pName,
                    PatientPhone = pPhone,
                    BillingStage = "Medicine",
                    TotalAmount = items.Sum(i => i.TotalPrice),
                    Items = items
                });
            }

            return result;
        }

        // =========================================================================
        // 5. SỔ TỔNG CUỐI LƯỢT KHÁM (VII.4: Final = Phí khám + Xét nghiệm + Thuốc)
        // =========================================================================
        if (normalizedStage == "Final")
        {
            var activeAppointments = await context.Appointments
                .AsNoTracking()
                .Include(a => a.Doctor)
                .Include(a => a.MedicalRecord)
                    .ThenInclude(mr => mr!.Prescription)
                        .ThenInclude(p => p!.Details)
                            .ThenInclude(d => d.Medicine)
                .Where(a => a.Status != AppointmentStatusConstants.Cancelled)
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();

            var unbilledTests = (await context.LabTests
                .AsNoTracking()
                .Include(t => t.LabTestType)
                .Where(t => t.Status != "Cancelled")
                .ToListAsync())
                .Where(t => !IsBilled("LabTest", t.Id))
                .ToList();

            foreach (var app in activeAppointments)
            {
                var items = new List<PendingBillingItemDto>();
                var billingPid = ResolveCanonicalBillingPatientId(app);

                // 1) Phí khám chưa thu
                if (!IsBilled("Appointment", app.AppointmentId))
                {
                    items.Add(new PendingBillingItemDto
                    {
                        SourceType = "Appointment",
                        SourceId = app.AppointmentId,
                        ItemName = $"Phí khám chuyên khoa - BS. {app.Doctor?.FullName ?? "Khám bệnh"}",
                        UnitPrice = DefaultExaminationFee,
                        Quantity = 1,
                        TotalPrice = DefaultExaminationFee
                    });
                }

                // 2) Xét nghiệm chưa thu trong ngày của bệnh nhân
                var eqIds = GetEquivalentPatientIds(billingPid);
                var appTests = unbilledTests
                    .Where(t => eqIds.Contains(t.PatientId) && t.CreatedAt.Date == app.AppointmentDate.Date)
                    .ToList();

                items.AddRange(appTests.Select(t => new PendingBillingItemDto
                {
                    SourceType = "LabTest",
                    SourceId = t.Id,
                    ItemName = t.LabTestType?.Name ?? $"Xét nghiệm #{t.Id}",
                    UnitPrice = t.LabTestType?.Price ?? 0m,
                    Quantity = 1,
                    TotalPrice = t.LabTestType?.Price ?? 0m
                }));

                // 3) Đơn thuốc đã chốt chưa thu
                var rx = app.MedicalRecord?.Prescription;
                if (rx is { Status: PrescriptionStatusConstants.Issued } && !IsBilled("Prescription", rx.PrescriptionId))
                {
                    foreach (var d in rx.Details)
                    {
                        if (IsBilled("PrescriptionDetail", d.PrescriptionDetailId)) continue;
                        items.Add(new PendingBillingItemDto
                        {
                            SourceType = "PrescriptionDetail",
                            SourceId = d.PrescriptionDetailId,
                            ItemName = $"{d.Medicine.MedicineName} ({d.Medicine.Unit})",
                            UnitPrice = d.Medicine.UnitPrice,
                            Quantity = d.Quantity,
                            TotalPrice = d.Medicine.UnitPrice * d.Quantity
                        });
                    }
                }

                if (items.Count == 0) continue;

                var (pName, pPhone) = ResolvePatientInfo(billingPid, app.PatientName, app.PatientPhone);
                result.Add(new PendingAppointmentBillingDto
                {
                    AppointmentId = app.AppointmentId,
                    PatientId = billingPid,
                    PatientName = pName,
                    PatientPhone = pPhone,
                    BillingStage = "Final",
                    TotalAmount = items.Sum(i => i.TotalPrice),
                    Items = items
                });
            }
        }

        return result;
    }

    public async Task<InvoiceResponseDto> CreateInvoiceAsync(int cashierId, CreateInvoiceDto dto)
    {
        try
        {
            return await CreateInvoiceCoreAsync(cashierId, dto);
        }
        catch (Exception error) when (dto?.BillingStage == "Book" && IsPaymentConflict(error))
        {
            throw new AppException(ErrorCode.BOOK_INVOICE_INVALID_STATUS);
        }
    }

    private async Task<InvoiceResponseDto> CreateInvoiceCoreAsync(int cashierId, CreateInvoiceDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        if (dto.Items is not { Count: > 0 })
            throw new AppException(ErrorCode.INVALID_REQUEST, "Hóa đơn phải có ít nhất một khoản mục.");

        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        // VII.5: Kiểm tra trùng lặp và DỰNG LẠI ĐƠN GIÁ / SỐ LƯỢNG CHUẨN TỪ SERVER (không tin giá client gửi lên)
        var verifiedDetails = new List<InvoiceDetail>();
        var paidBookInvoicesToNotify = new List<BookInvoice>();

        foreach (var rawItem in dto.Items)
        {
            var alreadyBilled = await context.InvoiceDetails.AnyAsync(d =>
                d.SourceType == rawItem.SourceType &&
                d.SourceId == rawItem.SourceId &&
                d.Invoice != null &&
                d.Invoice.InvoiceType == "Standard");

            if (alreadyBilled)
            {
                if (dto.BillingStage == "Book")
                    throw new AppException(ErrorCode.BOOK_INVOICE_INVALID_STATUS);
                throw new AppException(ErrorCode.INVALID_REQUEST,
                    $"Khoản phí '{rawItem.ItemName}' (Mã: {rawItem.SourceId}) đã được lập hóa đơn trước đó!");
            }

            switch (rawItem.SourceType)
            {
                case "Appointment":
                {
                    var app = await context.Appointments
                        .Include(a => a.Doctor)
                        .FirstOrDefaultAsync(a => a.AppointmentId == rawItem.SourceId)
                        ?? throw new AppException(ErrorCode.APPOINTMENT_NOT_FOUND);

                    if (dto.AppointmentId is > 0 && dto.AppointmentId != app.AppointmentId)
                        throw new AppException(ErrorCode.INVALID_REQUEST, "Khoản phí khám không khớp lượt khám đang chọn.");

                    verifiedDetails.Add(new InvoiceDetail
                    {
                        SourceType = "Appointment",
                        SourceId = app.AppointmentId,
                        ItemName = $"Phí khám chuyên khoa - BS. {app.Doctor?.FullName ?? "Khám bệnh"}",
                        UnitPrice = DefaultExaminationFee,
                        Quantity = 1,
                        TotalPrice = DefaultExaminationFee
                    });
                    break;
                }

                case "LabTest":
                {
                    var test = await context.LabTests
                        .Include(t => t.LabTestType)
                        .FirstOrDefaultAsync(t => t.Id == rawItem.SourceId)
                        ?? throw new AppException(ErrorCode.INVALID_REQUEST, $"Không tìm thấy xét nghiệm #{rawItem.SourceId}.");

                    var price = test.LabTestType?.Price ?? 0m;
                    verifiedDetails.Add(new InvoiceDetail
                    {
                        SourceType = "LabTest",
                        SourceId = test.Id,
                        ItemName = test.LabTestType?.Name ?? $"Xét nghiệm #{test.Id}",
                        UnitPrice = price,
                        Quantity = 1,
                        TotalPrice = price
                    });
                    break;
                }

                case "PrescriptionDetail":
                {
                    var rxDetail = await context.PrescriptionDetails
                        .Include(d => d.Medicine)
                        .Include(d => d.Prescription)
                            .ThenInclude(p => p.MedicalRecord)
                        .FirstOrDefaultAsync(d => d.PrescriptionDetailId == rawItem.SourceId)
                        ?? throw new AppException(ErrorCode.INVALID_REQUEST, $"Không tìm thấy chi tiết đơn thuốc #{rawItem.SourceId}.");

                    if (rxDetail.Prescription.Status != PrescriptionStatusConstants.Issued)
                        throw new AppException(ErrorCode.PRESCRIPTION_INVALID_STATUS, "Đơn thuốc chưa ở trạng thái chốt phát thuốc.");

                    if (dto.AppointmentId is > 0 && rxDetail.Prescription.MedicalRecord.AppointmentId != dto.AppointmentId)
                        throw new AppException(ErrorCode.INVALID_REQUEST, "Thuốc không thuộc lượt khám đang lập hóa đơn.");

                    var unitPrice = rxDetail.Medicine.UnitPrice;
                    verifiedDetails.Add(new InvoiceDetail
                    {
                        SourceType = "PrescriptionDetail",
                        SourceId = rxDetail.PrescriptionDetailId,
                        ItemName = $"{rxDetail.Medicine.MedicineName} ({rxDetail.Medicine.Unit})",
                        UnitPrice = unitPrice,
                        Quantity = rxDetail.Quantity,
                        TotalPrice = unitPrice * rxDetail.Quantity
                    });
                    break;
                }

                case "BookRequest":
                {
                    var req = await context.PatientBookRequests
                        .Include(r => r.BookInvoice)
                        .FirstOrDefaultAsync(r => r.PatientBookRequestId == rawItem.SourceId)
                        ?? throw new AppException(ErrorCode.INVALID_REQUEST, $"Không tìm thấy yêu cầu cấp sổ #{rawItem.SourceId}.");

                    if (req.PatientId != dto.PatientId)
                        throw new AppException(ErrorCode.BOOK_INVOICE_INVALID_STATUS);

                    var bookInv = req.BookInvoice;
                    if (bookInv == null)
                    {
                        bookInv = new BookInvoice
                        {
                            PatientId = req.PatientId,
                            Amount = DefaultBookFee,
                            Status = "Unpaid",
                            CreatedAt = DateTime.UtcNow
                        };
                        context.BookInvoices.Add(bookInv);
                        await context.SaveChangesAsync();
                        req.BookInvoiceId = bookInv.BookInvoiceId;
                    }

                    verifiedDetails.Add(new InvoiceDetail
                    {
                        SourceType = "BookRequest",
                        SourceId = req.PatientBookRequestId,
                        ItemName = $"Phí cấp sổ khám bệnh (Yêu cầu #{req.PatientBookRequestId})",
                        UnitPrice = bookInv.Amount,
                        Quantity = 1,
                        TotalPrice = bookInv.Amount
                    });
                    break;
                }

                case "Book":
                {
                    var bookInv = await context.BookInvoices
                        .FirstOrDefaultAsync(b => b.BookInvoiceId == rawItem.SourceId)
                        ?? throw new AppException(ErrorCode.BOOK_INVOICE_NOT_FOUND);

                    if (bookInv.PatientId != dto.PatientId || bookInv.Status != "Unpaid")
                        throw new AppException(ErrorCode.BOOK_INVOICE_INVALID_STATUS);

                    verifiedDetails.Add(new InvoiceDetail
                    {
                        SourceType = "Book",
                        SourceId = bookInv.BookInvoiceId,
                        ItemName = $"Phí cấp sổ khám bệnh (#{bookInv.BookInvoiceId})",
                        UnitPrice = bookInv.Amount,
                        Quantity = 1,
                        TotalPrice = bookInv.Amount
                    });
                    break;
                }

                default:
                    throw new AppException(ErrorCode.INVALID_REQUEST, $"Loại nguồn phí không hợp lệ: {rawItem.SourceType}");
            }
        }

        // Tính tổng tiền chuẩn trên server
        var totalAmount = verifiedDetails.Sum(d => d.TotalPrice);
        var discountPercent = Math.Clamp(dto.InsuranceDiscountPercent, 0m, 100m);
        var insuranceAmount = Math.Round(totalAmount * discountPercent / 100m);
        var patientAmount = totalAmount - insuranceAmount;

        // VII.6: Tách bạch lập hóa đơn và ghi nhận thanh toán (cho phép 0đ, một phần, hoặc đủ)
        var initialPaid = dto.InitialPaymentAmount ?? patientAmount;
        if (initialPaid < 0 || initialPaid > patientAmount)
            throw new AppException(ErrorCode.INVALID_REQUEST, "Số tiền thanh toán ban đầu không hợp lệ (phải từ 0 đến số tiền bệnh nhân phải trả).");

        var status = ResolvePaymentStatus(patientAmount, initialPaid);

        var invoice = new Invoice
        {
            AppointmentId = dto.AppointmentId is > 0 ? dto.AppointmentId : null,
            PatientId = dto.PatientId,
            CashierId = cashierId,
            BillingStage = dto.BillingStage,
            InvoiceType = "Standard",
            PaymentMethod = dto.PaymentMethod,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            TotalAmount = totalAmount,
            InsuranceDiscountPercent = discountPercent,
            InsuranceAmount = insuranceAmount,
            PatientAmount = patientAmount,
            PaidAmount = initialPaid,
            InvoiceDetails = verifiedDetails
        };

        if (initialPaid > 0 || patientAmount == 0)
        {
            invoice.Payments.Add(new InvoicePayment
            {
                ReceiptNumber = await GenerateReceiptNumberAsync("PT"),
                PaymentType = "Payment",
                Amount = initialPaid,
                PaymentMethod = dto.PaymentMethod,
                ReferenceCode = string.IsNullOrWhiteSpace(dto.ReferenceCode) ? null : dto.ReferenceCode.Trim(),
                Note = string.IsNullOrWhiteSpace(dto.PaymentNote) ? "Thanh toán khi lập hóa đơn" : dto.PaymentNote.Trim(),
                CashierId = cashierId,
                PaidAt = DateTime.UtcNow
            });
        }

        context.Invoices.Add(invoice);
        await context.SaveChangesAsync();

        // Nếu là hóa đơn tiền sổ và đã thanh toán đủ -> đồng bộ BookInvoice = Paid
        if (invoice.BillingStage == "Book" && invoice.Status == "Paid")
        {
            await SyncBookInvoicesPaidAsync(invoice, paidBookInvoicesToNotify);
        }

        await transaction.CommitAsync();

        foreach (var bi in paidBookInvoicesToNotify)
            await notifications.PublishBookInvoiceChangedAsync(bi);

        return (await GetInvoiceByIdAsync(invoice.Id))!;
    }

    // VII.6: Ghi nhận thanh toán bổ sung / thanh toán từng phần cho hóa đơn đã lập
    public async Task<InvoiceResponseDto> RecordPaymentAsync(int invoiceId, int cashierId, RecordInvoicePaymentDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        if (dto.Amount <= 0)
            throw new AppException(ErrorCode.INVALID_REQUEST, "Số tiền thanh toán phải lớn hơn 0.");

        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var invoice = await context.Invoices
            .Include(i => i.InvoiceDetails)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == invoiceId)
            ?? throw new AppException(ErrorCode.INVALID_REQUEST, "Không tìm thấy hóa đơn.");

        if (invoice.InvoiceType != "Standard")
            throw new AppException(ErrorCode.INVALID_REQUEST, "Không thể ghi nhận thanh toán vào chứng từ điều chỉnh.");

        var remaining = invoice.PatientAmount - invoice.PaidAmount;
        if (remaining <= 0 || invoice.Status == "Paid")
            throw new AppException(ErrorCode.INVALID_REQUEST, "Hóa đơn này đã được thanh toán đủ.");

        if (dto.Amount > remaining)
            throw new AppException(ErrorCode.INVALID_REQUEST, $"Số tiền thu ({dto.Amount:N0}đ) vượt quá số dư còn lại ({remaining:N0}đ).");

        var payment = new InvoicePayment
        {
            InvoiceId = invoice.Id,
            ReceiptNumber = await GenerateReceiptNumberAsync("PT"),
            PaymentType = "Payment",
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            ReferenceCode = string.IsNullOrWhiteSpace(dto.ReferenceCode) ? null : dto.ReferenceCode.Trim(),
            Note = string.IsNullOrWhiteSpace(dto.Note) ? "Thu tiền bổ sung" : dto.Note.Trim(),
            CashierId = cashierId,
            PaidAt = DateTime.UtcNow
        };

        invoice.Payments.Add(payment);
        invoice.PaidAmount += dto.Amount;
        invoice.PaymentMethod = dto.PaymentMethod;
        invoice.Status = ResolvePaymentStatus(invoice.PatientAmount, invoice.PaidAmount);

        var paidBookInvoices = new List<BookInvoice>();
        if (invoice.BillingStage == "Book" && invoice.Status == "Paid")
        {
            await SyncBookInvoicesPaidAsync(invoice, paidBookInvoices);
        }

        await context.SaveChangesAsync();
        await transaction.CommitAsync();

        foreach (var bi in paidBookInvoices)
            await notifications.PublishBookInvoiceChangedAsync(bi);

        return (await GetInvoiceByIdAsync(invoice.Id))!;
    }

    public async Task<InvoiceResponseDto?> GetInvoiceByIdAsync(int id)
    {
        var invoice = await context.Invoices
            .AsNoTracking()
            .Include(i => i.InvoiceDetails)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null) return null;

        var patient = await context.Patients.AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == invoice.PatientId || p.PatientId == invoice.PatientId);
        var user = patient == null
            ? await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == invoice.PatientId)
            : null;

        return MapInvoice(invoice, patient?.FullName ?? user?.FullName, patient?.Phone ?? user?.Phone);
    }

    public async Task<IEnumerable<InvoiceResponseDto>> GetInvoiceHistoryAsync(string? searchKeyword)
    {
        var query = context.Invoices
            .AsNoTracking()
            .Include(i => i.InvoiceDetails)
            .Include(i => i.Payments)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchKeyword))
        {
            var keyword = searchKeyword.Trim();
            var isNumber = int.TryParse(keyword, out var id);
            query = query.Where(invoice =>
                invoice.InvoiceDetails.Any(d => d.ItemName.Contains(keyword) || d.SourceType.Contains(keyword)) ||
                invoice.Payments.Any(p => p.ReceiptNumber.Contains(keyword) || (p.ReferenceCode != null && p.ReferenceCode.Contains(keyword))) ||
                invoice.Status.Contains(keyword) ||
                invoice.BillingStage.Contains(keyword) ||
                invoice.InvoiceType.Contains(keyword) ||
                invoice.PaymentMethod.Contains(keyword) ||
                (isNumber && (invoice.Id == id || invoice.OriginalInvoiceId == id || invoice.PatientId == id || invoice.AppointmentId == id)));
        }

        var invoices = await query
            .OrderByDescending(i => i.CreatedAt)
            .ThenByDescending(i => i.Id)
            .ToListAsync();

        var patients = await context.Patients.AsNoTracking().ToListAsync();
        var users = await context.Users.AsNoTracking().ToListAsync();

        return invoices.Select(inv =>
        {
            var p = patients.FirstOrDefault(x => x.UserId == inv.PatientId || x.PatientId == inv.PatientId);
            var u = p == null ? users.FirstOrDefault(x => x.UserId == inv.PatientId) : null;
            return MapInvoice(inv, p?.FullName ?? u?.FullName, p?.Phone ?? u?.Phone);
        }).ToList();
    }

    // VII.8: Điều chỉnh / hoàn tiền và đối soát đơn thuốc AwaitingBilling
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

        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var original = await context.Invoices
            .Include(i => i.InvoiceDetails)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == dto.OriginalInvoiceId)
            ?? throw new InvalidOperationException("Không tìm thấy hóa đơn gốc.");

        if (original.InvoiceType == "Adjustment")
            throw new InvalidOperationException("Không thể tạo chứng từ điều chỉnh từ một hóa đơn điều chỉnh.");

        // Chặn hoàn tiền vượt quá số tiền bệnh nhân đã thực thanh toán trên hóa đơn gốc (cộng dồn các lần điều chỉnh trước)
        if (dto.AdjustmentPatientAmount < 0)
        {
            var previousRefunds = await context.Invoices
                .Where(i => i.OriginalInvoiceId == original.Id && i.InvoiceType == "Adjustment" && i.PatientAmount < 0)
                .SumAsync(i => i.PatientAmount);

            var maxRefundable = original.PaidAmount + previousRefunds; // previousRefunds <= 0
            if (Math.Abs(dto.AdjustmentPatientAmount) > maxRefundable)
                throw new InvalidOperationException($"Số tiền hoàn ({Math.Abs(dto.AdjustmentPatientAmount):N0}đ) vượt quá số tiền bệnh nhân đã thanh toán ({maxRefundable:N0}đ).");
        }

        var adjustment = new Invoice
        {
            AppointmentId = original.AppointmentId,
            PatientId = original.PatientId,
            CashierId = cashierId,
            BillingStage = original.BillingStage,
            InvoiceType = "Adjustment",
            OriginalInvoiceId = original.Id,
            PaymentMethod = dto.PaymentMethod,
            Status = dto.AdjustmentPatientAmount < 0 ? "Refunded" : "Paid",
            CreatedAt = DateTime.UtcNow,
            TotalAmount = dto.AdjustmentTotalAmount,
            InsuranceAmount = dto.AdjustmentInsuranceAmount,
            PatientAmount = dto.AdjustmentPatientAmount,
            PaidAmount = dto.AdjustmentPatientAmount
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

        // Tạo phiếu thu (thu thêm) hoặc phiếu chi hoàn tiền (hoàn lại) tương ứng
        if (dto.AdjustmentPatientAmount != 0)
        {
            var isRefund = dto.AdjustmentPatientAmount < 0;
            adjustment.Payments.Add(new InvoicePayment
            {
                ReceiptNumber = await GenerateReceiptNumberAsync(isRefund ? "PH" : "PT"),
                PaymentType = isRefund ? "Refund" : "Payment",
                Amount = Math.Abs(dto.AdjustmentPatientAmount),
                PaymentMethod = dto.PaymentMethod,
                ReferenceCode = string.IsNullOrWhiteSpace(dto.ReferenceCode) ? null : dto.ReferenceCode.Trim(),
                Note = dto.Reason.Trim(),
                CashierId = cashierId,
                PaidAt = DateTime.UtcNow
            });
        }

        // VII.8: Nối chứng từ điều chỉnh với quy trình đối soát đơn thuốc đang AwaitingBilling
        PrescriptionStockReview? linkedReview = null;
        if (dto.PrescriptionStockReviewId.HasValue)
        {
            linkedReview = await context.PrescriptionStockReviews
                .Include(r => r.Decisions)
                .FirstOrDefaultAsync(r => r.PrescriptionStockReviewId == dto.PrescriptionStockReviewId.Value);
        }
        else if (original.AppointmentId.HasValue)
        {
            linkedReview = await context.PrescriptionStockReviews
                .Include(r => r.Decisions)
                .Include(r => r.Prescription)
                    .ThenInclude(p => p.MedicalRecord)
                .FirstOrDefaultAsync(r =>
                    r.Status == "Pending" &&
                    (r.InvoiceId == original.Id || r.Prescription.MedicalRecord.AppointmentId == original.AppointmentId));
        }

        if (linkedReview is { Status: "Pending" })
        {
            linkedReview.PaymentStatus = dto.AdjustmentPatientAmount < 0 ? "Refunded" : "AdjustedPaid";
            linkedReview.UpdatedAt = DateTime.UtcNow;
            linkedReview.Decisions.Add(new PrescriptionStockReviewDecision
            {
                DoctorUserId = cashierId, // Actor thực hiện đối soát thu ngân
                Action = "BillingAdjusted",
                Outcome = "BillingReconciled",
                Reason = $"Thu ngân lập chứng từ điều chỉnh: {dto.Reason.Trim()}",
                BeforeJson = $"{{\"originalInvoiceId\":{original.Id},\"paidAmount\":{original.PaidAmount}}}",
                AfterJson = $"{{\"adjustmentPatientAmount\":{dto.AdjustmentPatientAmount},\"paymentStatus\":\"{linkedReview.PaymentStatus}\"}}",
                CreatedAt = DateTime.UtcNow
            });
        }

        context.Invoices.Add(adjustment);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();

        return (await GetInvoiceByIdAsync(adjustment.Id))!;
    }

    private async Task SyncBookInvoicesPaidAsync(Invoice invoice, List<BookInvoice> paidBookInvoicesToNotify)
    {
        var bookIds = invoice.InvoiceDetails
            .Where(d => d.SourceType == "Book")
            .Select(d => d.SourceId)
            .ToList();

        var requestIds = invoice.InvoiceDetails
            .Where(d => d.SourceType == "BookRequest")
            .Select(d => d.SourceId)
            .ToList();

        if (requestIds.Count > 0)
        {
            var reqBookIds = await context.PatientBookRequests
                .Where(r => requestIds.Contains(r.PatientBookRequestId) && r.BookInvoiceId != null)
                .Select(r => r.BookInvoiceId!.Value)
                .ToListAsync();
            bookIds.AddRange(reqBookIds);
        }

        var distinctBookIds = bookIds.Distinct().ToList();
        if (distinctBookIds.Count == 0) return;

        var bookInvoices = await context.BookInvoices
            .Where(b => distinctBookIds.Contains(b.BookInvoiceId))
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var bi in bookInvoices)
        {
            if (bi.Status == "Unpaid")
            {
                bi.Status = "Paid";
                bi.PaidAt = now;
                paidBookInvoicesToNotify.Add(bi);
            }
        }

        await context.SaveChangesAsync();

        var notificationsToPublish = await notifications.StageAsync(
            await notifications.ReceptionRecipientsAsync(),
            $"invoice:{invoice.Id}:book-paid",
            "Billing",
            "Tiền sổ đã thanh toán",
            $"Hóa đơn Book #{invoice.Id} đã thanh toán đủ. Lễ tân có thể xử lý cấp sổ.");
        await context.SaveChangesAsync();
        await notifications.PublishAsync(notificationsToPublish);
    }

    private async Task<string> GenerateReceiptNumberAsync(string prefix)
    {
        var datePart = DateTime.UtcNow.AddHours(7).ToString("yyyyMMdd");
        var fullPrefix = $"{prefix}-{datePart}-";
        var countToday = await context.InvoicePayments.CountAsync(p => p.ReceiptNumber.StartsWith(fullPrefix));
        return $"{fullPrefix}{(countToday + 1):D4}";
    }

    private static string ResolvePaymentStatus(decimal patientAmount, decimal paidAmount)
    {
        if (patientAmount <= 0 || paidAmount >= patientAmount) return "Paid";
        if (paidAmount > 0) return "PartiallyPaid";
        return "Unpaid";
    }

    private static bool IsPaymentConflict(Exception error)
    {
        for (Exception? current = error; current != null; current = current.InnerException)
            if (current is SqlException { Number: 1205 or 2601 or 2627 }) return true;
        return false;
    }

    private static InvoiceResponseDto MapInvoice(Invoice invoice, string? patientName, string? patientPhone) => new()
    {
        Id = invoice.Id,
        AppointmentId = invoice.AppointmentId,
        PatientId = invoice.PatientId,
        PatientName = patientName ?? $"Bệnh nhân #{invoice.PatientId}",
        PatientPhone = patientPhone ?? string.Empty,
        CashierId = invoice.CashierId,
        BillingStage = invoice.BillingStage,
        InvoiceType = invoice.InvoiceType,
        OriginalInvoiceId = invoice.OriginalInvoiceId,
        TotalAmount = invoice.TotalAmount,
        InsuranceDiscountPercent = invoice.InsuranceDiscountPercent,
        InsuranceAmount = invoice.InsuranceAmount,
        PatientAmount = invoice.PatientAmount,
        PaidAmount = invoice.PaidAmount,
        RemainingAmount = invoice.InvoiceType == "Standard"
            ? Math.Max(0m, invoice.PatientAmount - invoice.PaidAmount)
            : 0m,
        PaymentMethod = invoice.PaymentMethod,
        Status = invoice.Status,
        CreatedAt = invoice.CreatedAt,
        Details = invoice.InvoiceDetails.Select(d => new InvoiceDetailResponseDto
        {
            Id = d.Id,
            SourceType = d.SourceType,
            SourceId = d.SourceId,
            ItemName = d.ItemName,
            UnitPrice = d.UnitPrice,
            Quantity = d.Quantity,
            TotalPrice = d.TotalPrice
        }).ToList(),
        Payments = invoice.Payments
            .OrderByDescending(p => p.PaidAt)
            .Select(p => new InvoicePaymentResponseDto
            {
                Id = p.Id,
                ReceiptNumber = p.ReceiptNumber,
                PaymentType = p.PaymentType,
                Amount = p.Amount,
                PaymentMethod = p.PaymentMethod,
                ReferenceCode = p.ReferenceCode,
                Note = p.Note,
                CashierId = p.CashierId,
                PaidAt = p.PaidAt
            }).ToList()
    };
}
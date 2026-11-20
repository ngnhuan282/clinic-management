using System.Data;
using ClinicManagement.DTOs.Requests.Billing;
using ClinicManagement.DTOs.Responses.Billing;
using ClinicManagement.Commons;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using ClinicManagement.Exceptions;
using ClinicManagement.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Services.Implementations;

public partial class InvoiceService(
    ApplicationDbContext context,
    INotificationService notifications) : IInvoiceService
{
    public async Task<List<PendingAppointmentBillingDto>> GetPendingBillingsAsync(string stage)
    {
        var settings = await ClinicSettingsService.ReadSnapshotSafeAsync(context);
        var DefaultExaminationFee = settings.DefaultExaminationFee;
        var DefaultBookFee = settings.PatientBookFee;
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
                if (IsBilled("BookRequest", req.PatientBookRequestId)
                    || (req.BookInvoiceId.HasValue && IsBilled("Book", req.BookInvoiceId.Value))) continue;

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
                var matchedApp = appointments.FirstOrDefault(a => a.AppointmentId == test.AppointmentId);

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
                }).Where(i => !IsBilled(i.SourceType, i.SourceId)).ToList();

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
                .Where(a => a.Status == AppointmentStatusConstants.Completed)
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
                var appTests = unbilledTests
                    .Where(t => t.AppointmentId == app.AppointmentId)
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
        if (dto.PatientId <= 0 || dto.BillingStage is not ("Book" or "Pending" or "LabAndConsultation" or "Medicine" or "Final")
            || dto.Items.Any(i => i.SourceId <= 0)
            || dto.Items.Select(i => (i.SourceType, i.SourceId)).Distinct().Count() != dto.Items.Count)
            throw new AppException(ErrorCode.INVALID_REQUEST);
        if ((dto.BillingStage == "Book" && dto.Items.Count != 1)
            || (dto.Items.Any(i => i.SourceType is "Appointment" or "PrescriptionDetail") && dto.AppointmentId is not > 0))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        if (dto.Items.Any(i => dto.BillingStage switch
            {
                "Book" => i.SourceType is not ("Book" or "BookRequest"),
                "Pending" => i.SourceType != "Appointment",
                "LabAndConsultation" => i.SourceType is not ("Appointment" or "LabTest"),
                "Medicine" => i.SourceType != "PrescriptionDetail",
                "Final" => i.SourceType is not ("Appointment" or "LabTest" or "PrescriptionDetail"),
                _ => true
            })) throw new AppException(ErrorCode.INVALID_REQUEST);

        var settings = await ClinicSettingsService.ReadSnapshotSafeAsync(context);
        var DefaultExaminationFee = settings.DefaultExaminationFee;
        var DefaultBookFee = settings.PatientBookFee;

        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        if (dto.BillingStage != "Book" && dto.AppointmentId is > 0)
        {
            var visit = await context.Appointments.Include(a => a.MedicalRecord)
                .SingleOrDefaultAsync(a => a.AppointmentId == dto.AppointmentId)
                ?? throw new AppException(ErrorCode.APPOINTMENT_NOT_FOUND);
            var patientId = visit.MedicalRecord?.PatientId ?? visit.PatientId ?? visit.PatientProfileId;
            if (patientId != dto.PatientId || visit.Status == AppointmentStatusConstants.Cancelled)
                throw new AppException(ErrorCode.INVALID_REQUEST);
        }

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
                    if ((app.PatientId ?? app.PatientProfileId) != dto.PatientId || app.Status == AppointmentStatusConstants.Cancelled)
                        throw new AppException(ErrorCode.INVALID_REQUEST);

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
                    if (test.Status == "Cancelled"
                        || (test.AppointmentId.HasValue && test.AppointmentId != dto.AppointmentId)
                        || (!test.AppointmentId.HasValue && test.PatientId != dto.PatientId))
                        throw new AppException(ErrorCode.INVALID_REQUEST);
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
                    var rxVisit = await context.Appointments.SingleAsync(a => a.AppointmentId == rxDetail.Prescription.MedicalRecord.AppointmentId);
                    if ((rxDetail.Prescription.MedicalRecord.PatientId ?? rxVisit.PatientId ?? rxVisit.PatientProfileId) != dto.PatientId)
                        throw new AppException(ErrorCode.INVALID_REQUEST);

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
                    if (bookInv != null && (bookInv.Status != "Unpaid" || await context.InvoiceDetails.AnyAsync(d =>
                        d.SourceType == "Book" && d.SourceId == bookInv.BookInvoiceId && d.Invoice!.InvoiceType == "Standard")))
                        throw new AppException(ErrorCode.BOOK_INVOICE_INVALID_STATUS);
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
                    if (await context.PatientBookRequests.AnyAsync(r => r.BookInvoiceId == bookInv.BookInvoiceId
                        && context.InvoiceDetails.Any(d => d.SourceType == "BookRequest" && d.SourceId == r.PatientBookRequestId
                            && d.Invoice!.InvoiceType == "Standard")))
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
        List<Notification> bookNotifications = [];
        if (invoice.BillingStage == "Book" && invoice.Status == "Paid")
        {
            bookNotifications = await SyncBookInvoicesPaidAsync(invoice, paidBookInvoicesToNotify);
            await context.SaveChangesAsync();
        }

        await transaction.CommitAsync();

        await notifications.PublishAsync(bookNotifications);
        foreach (var bi in paidBookInvoicesToNotify)
            await notifications.PublishBookInvoiceChangedAsync(bi);

        return (await GetInvoiceByIdAsync(invoice.Id))!;
    }

    // VII.6: Ghi nhận thanh toán bổ sung / thanh toán từng phần cho hóa đơn đã lập
    public async Task<InvoiceResponseDto> RecordPaymentAsync(int invoiceId, int cashierId, RecordInvoicePaymentDto dto)
    {
        try { return await RecordPaymentCoreAsync(invoiceId, cashierId, dto); }
        catch (Exception error) when (IsPaymentConflict(error))
        { throw new AppException(ErrorCode.DATA_CONCURRENCY_CONFLICT); }
    }

    private async Task<InvoiceResponseDto> RecordPaymentCoreAsync(int invoiceId, int cashierId, RecordInvoicePaymentDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        if (dto.Amount <= 0 || dto.Amount != decimal.Round(dto.Amount, 2))
            throw new AppException(ErrorCode.INVALID_REQUEST, "Số tiền thanh toán phải lớn hơn 0.");

        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var invoice = await context.Invoices
            .Include(i => i.InvoiceDetails)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == invoiceId)
            ?? throw new AppException(ErrorCode.INVALID_REQUEST, "Không tìm thấy hóa đơn.");

        if (invoice.InvoiceType != "Standard")
            throw new AppException(ErrorCode.INVALID_REQUEST, "Không thể ghi nhận thanh toán vào chứng từ điều chỉnh.");

        if (await HasUnpricedStockProposalAsync(invoice.Id))
            throw new AppException(ErrorCode.INVALID_REQUEST, "Hãy đối soát phương án đơn thuốc trước khi thu thêm.");

        var balance = await ReadBalanceAsync(invoice);
        var remaining = balance.Remaining;
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
        invoice.Status = ResolvePaymentStatus(balance.Patient, balance.NetPaid + dto.Amount);
        var reviewNotifications = invoice.Status == "Paid" ? await VerifyPendingReviewAsync(invoice.Id, cashierId) : [];

        var paidBookInvoices = new List<BookInvoice>();
        List<Notification> bookNotifications = [];
        if (invoice.BillingStage == "Book" && invoice.Status == "Paid")
        {
            bookNotifications = await SyncBookInvoicesPaidAsync(invoice, paidBookInvoices);
        }

        await context.SaveChangesAsync();
        await transaction.CommitAsync();

        await notifications.PublishAsync(reviewNotifications.Concat(bookNotifications));
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

        var visit = invoice.AppointmentId is > 0
            ? await context.Appointments.AsNoTracking().SingleOrDefaultAsync(a => a.AppointmentId == invoice.AppointmentId)
            : null;
        var balance = await ReadBalanceAsync(invoice);
        if (visit != null) return MapInvoice(invoice, visit.PatientName, visit.PatientPhone, balance);

        var patient = await context.Patients.AsNoTracking()
            .FirstOrDefaultAsync(p => invoice.BillingStage == "Book" ? p.PatientId == invoice.PatientId : p.UserId == invoice.PatientId);
        var user = patient == null
            ? await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == invoice.PatientId)
            : null;

        return MapInvoice(invoice, patient?.FullName ?? user?.FullName, patient?.Phone ?? user?.Phone, balance);
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

        var visitIds = invoices.Where(i => i.AppointmentId is > 0).Select(i => i.AppointmentId!.Value).Distinct().ToArray();
        var visits = await context.Appointments.AsNoTracking().Where(a => visitIds.Contains(a.AppointmentId))
            .ToDictionaryAsync(a => a.AppointmentId);
        var adjustments = await ReadAdjustmentTotalsAsync(invoices.Select(i => i.Id).ToArray());
        var pendingReviews = await context.PrescriptionStockReviews.AsNoTracking()
            .Where(r => r.Status == "Pending" && r.InvoiceId.HasValue)
            .Select(r => new
            {
                r.PrescriptionStockReviewId, InvoiceId = r.InvoiceId!.Value,
                LatestOutcome = r.Decisions.OrderByDescending(d => d.PrescriptionStockReviewDecisionId).Select(d => d.Outcome).FirstOrDefault(),
            }).Where(r => r.LatestOutcome == "AwaitingBilling").ToListAsync();
        var reviewInvoiceIds = pendingReviews.Select(r => r.InvoiceId).Distinct().ToArray();
        var reviewOrigins = await context.Invoices.AsNoTracking().Where(i => reviewInvoiceIds.Contains(i.Id))
            .ToDictionaryAsync(i => i.Id, i => i.OriginalInvoiceId ?? i.Id);
        var reviewByOriginal = pendingReviews.GroupBy(r => reviewOrigins.GetValueOrDefault(r.InvoiceId, r.InvoiceId))
            .ToDictionary(g => g.Key, g => g.Max(r => r.PrescriptionStockReviewId));

        return invoices.Select(inv =>
        {
            var balance = GetBalance(inv, adjustments.GetValueOrDefault(inv.Id));
            InvoiceResponseDto AddReview(InvoiceResponseDto response)
            {
                if (reviewByOriginal.TryGetValue(inv.Id, out var reviewId)) response.PendingStockReviewId = reviewId;
                return response;
            }
            if (inv.AppointmentId.HasValue && visits.TryGetValue(inv.AppointmentId.Value, out var visit))
                return AddReview(MapInvoice(inv, visit.PatientName, visit.PatientPhone, balance));
            var p = patients.FirstOrDefault(x => inv.BillingStage == "Book" ? x.PatientId == inv.PatientId : x.UserId == inv.PatientId);
            var u = p == null ? users.FirstOrDefault(x => x.UserId == inv.PatientId) : null;
            return AddReview(MapInvoice(inv, p?.FullName ?? u?.FullName, p?.Phone ?? u?.Phone, balance));
        }).ToList();
    }

    private async Task<List<Notification>> SyncBookInvoicesPaidAsync(Invoice invoice, List<BookInvoice> paidBookInvoicesToNotify)
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
        if (distinctBookIds.Count == 0) return [];

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

        if (paidBookInvoicesToNotify.Count == 0) return [];
        return await notifications.StageAsync(
            await notifications.ReceptionRecipientsAsync(),
            $"invoice:{invoice.Id}:book-paid",
            "Billing",
            "Tiền sổ đã thanh toán",
            $"Hóa đơn Book #{invoice.Id} đã thanh toán đủ. Lễ tân có thể xử lý cấp sổ.");
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

    private static InvoiceResponseDto MapInvoice(Invoice invoice, string? patientName, string? patientPhone, InvoiceBalance balance) => new()
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
        TotalAmount = balance.Total,
        InsuranceDiscountPercent = invoice.InsuranceDiscountPercent,
        InsuranceAmount = balance.Insurance,
        PatientAmount = balance.Patient,
        PaidAmount = balance.NetPaid,
        RemainingAmount = invoice.InvoiceType == "Standard" ? balance.Remaining : 0m,
        OriginalPatientAmount = invoice.PatientAmount,
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

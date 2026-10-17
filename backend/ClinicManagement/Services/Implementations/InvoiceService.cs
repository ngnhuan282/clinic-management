<<<<<<< HEAD
=======
// // using System;
// // using System.Collections.Generic;
// // using System.Linq;
// // using System.Threading.Tasks;
// // using Microsoft.EntityFrameworkCore;
// // using ClinicManagement.Data;
// // using ClinicManagement.Data.Entities;
// // using ClinicManagement.DTOs.Invoices;
// // using ClinicManagement.Services.Interfaces;

// // namespace ClinicManagement.Services.Implementations
// // {
// //     public class InvoiceService : IInvoiceService
// //     {
// //         private readonly ApplicationDbContext _context;

// //         public InvoiceService(ApplicationDbContext context)
// //         {
// //             _context = context;
// //         }

// //        public async Task<List<PendingAppointmentBillingDto>> GetPendingBillingsAsync(string stage)
// // {
// //     var result = new List<PendingAppointmentBillingDto>();

// //     if (stage == "Pending")
// //     {
// //         // 1. Lấy danh sách AppointmentId đã xuất hóa đơn "Appointment"
// //         var paidAppointmentIds = await _context.InvoiceDetails
// //             .Where(d => d.SourceType == "Appointment")
// //             .Select(d => d.SourceId)
// //             .Distinct()
// //             .ToListAsync();

// //         // 2. Lấy danh sách Appointment chưa thanh toán phí khám ban đầu
// //         var pendingAppointments = await _context.Appointments
// //             .Where(a => !paidAppointmentIds.Contains(a.AppointmentId))
// //             .ToListAsync();

// //         foreach (var app in pendingAppointments)
// //         {
// //             decimal examinationFee = 150000;

// //             result.Add(new PendingAppointmentBillingDto
// //             {
// //                 AppointmentId = app.AppointmentId,
// //                 PatientId = app.PatientId ?? 0,
// //                 BillingStage = "Pending",
// //                 Items = new List<PendingBillingItemDto>
// //                 {
// //                     new PendingBillingItemDto
// //                     {
// //                         SourceType = "Appointment",
// //                         SourceId = app.AppointmentId,
// //                         ItemName = "Phí khám ban đầu",
// //                         UnitPrice = examinationFee,
// //                         Quantity = 1,
// //                         TotalPrice = examinationFee
// //                     }
// //                 }
// //             });
// //         }
// //     }
// //     else if (stage == "LabAndConsultation")
// //     {
// //         // 1. Lấy danh sách LabTest.Id đã được xuất hóa đơn "LabTest"
// //         var paidLabTestIds = await _context.InvoiceDetails
// //             .Where(d => d.SourceType == "LabTest")
// //             .Select(d => d.SourceId)
// //             .Distinct()
// //             .ToListAsync();

// //         // 2. Lấy các LabTest có Status == "Completed" VÀ chưa nằm trong InvoiceDetails
// //         var pendingLabTests = await _context.LabTests
// //             .Include(l => l.LabTestType)
// //             .Where(l => l.Status == "Completed" && !paidLabTestIds.Contains(l.Id))
// //             .ToListAsync();

// //         // 3. Gom nhóm danh sách xét nghiệm theo PatientId
// //         var groupedByPatient = pendingLabTests.GroupBy(l => l.PatientId);

// //         foreach (var group in groupedByPatient)
// //         {
// //             var items = group.Select(l => new PendingBillingItemDto
// //             {
// //                 SourceType = "LabTest",
// //                 SourceId = l.Id,
// //                 ItemName = l.LabTestType?.Name ?? "Xét nghiệm",
// //                 UnitPrice = l.LabTestType?.Price ?? 0,
// //                 Quantity = 1,
// //                 TotalPrice = l.LabTestType?.Price ?? 0
// //             }).ToList();

// //             result.Add(new PendingAppointmentBillingDto
// //             {
// //                 AppointmentId = 0, // Nhóm theo bệnh nhân (chờ thu tiền các xét nghiệm đã hoàn thành)
// //                 PatientId = group.Key,
// //                 BillingStage = "LabAndConsultation",
// //                 Items = items
// //             });
// //         }
// //     }

// //     return result;
// // }

// //         public async Task<InvoiceResponseDto> CreateInvoiceAsync(int cashierId, CreateInvoiceDto dto)
// // {
// //     // Kiểm tra chống thu trùng (Duplicate Check via SourceType + SourceId)
// //     foreach (var item in dto.Items)
// //     {
// //         bool isAlreadyPaid = await _context.InvoiceDetails
// //             .AnyAsync(d => d.SourceType == item.SourceType && d.SourceId == item.SourceId);

// //         if (isAlreadyPaid)
// //         {
// //             throw new InvalidOperationException($"Khoản phí '{item.ItemName}' (Mã: {item.SourceId}) đã được thanh toán trước đó!");
// //         }
// //     }

// //     var invoice = new Invoice
// //     {
// //         // Nếu AppointmentId <= 0 (như trường hợp LabAndConsultation = 0), gán null để không vi phạm khóa ngoại SQL
// //         AppointmentId = (dto.AppointmentId.HasValue && dto.AppointmentId.Value > 0) ? dto.AppointmentId.Value : null,
// //         PatientId = dto.PatientId,
// //         CashierId = cashierId,
// //         BillingStage = dto.BillingStage,
// //         PaymentMethod = dto.PaymentMethod,
// //         Status = "Paid",
// //         CreatedAt = DateTime.UtcNow,
// //         TotalAmount = dto.Items.Sum(x => x.UnitPrice * x.Quantity)
// //     };

// //     foreach (var item in dto.Items)
// //     {
// //         invoice.InvoiceDetails.Add(new InvoiceDetail
// //         {
// //             SourceType = item.SourceType,
// //             SourceId = item.SourceId,
// //             ItemName = item.ItemName,
// //             UnitPrice = item.UnitPrice,
// //             Quantity = item.Quantity,
// //             TotalPrice = item.UnitPrice * item.Quantity
// //         });
// //     }

// //     _context.Invoices.Add(invoice);
// //     await _context.SaveChangesAsync();

// //     return (await GetInvoiceByIdAsync(invoice.Id))!;
// // }

// //         public async Task<InvoiceResponseDto?> GetInvoiceByIdAsync(int id)
// //         {
// //             var inv = await _context.Invoices
// //                 .Include(i => i.InvoiceDetails)
// //                 .FirstOrDefaultAsync(i => i.Id == id);

// //             if (inv == null) return null;

// //             return new InvoiceResponseDto
// //             {
// //                 Id = inv.Id,
// //                 AppointmentId = inv.AppointmentId,
// //                 PatientId = inv.PatientId,
// //                 CashierId = inv.CashierId,
// //                 BillingStage = inv.BillingStage,
// //                 TotalAmount = inv.TotalAmount,
// //                 PaymentMethod = inv.PaymentMethod,
// //                 Status = inv.Status,
// //                 CreatedAt = inv.CreatedAt,
// //                 Details = inv.InvoiceDetails.Select(d => new InvoiceDetailResponseDto
// //                 {
// //                     Id = d.Id, // Sửa lại thành d.Id
// //                     SourceType = d.SourceType,
// //                     SourceId = d.SourceId,
// //                     ItemName = d.ItemName,
// //                     UnitPrice = d.UnitPrice,
// //                     Quantity = d.Quantity,
// //                     TotalPrice = d.TotalPrice
// //                 }).ToList()
// //             };
// //         }
// //     }
// // }
>>>>>>> main
// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading.Tasks;
// using Microsoft.EntityFrameworkCore;
// using ClinicManagement.Data;
// using ClinicManagement.Data.Entities;
// using ClinicManagement.DTOs.Invoices;
// using ClinicManagement.Services.Interfaces;

// namespace ClinicManagement.Services.Implementations
// {
//     public class InvoiceService : IInvoiceService
//     {
//         private readonly ApplicationDbContext _context;
<<<<<<< HEAD
//         private readonly INotificationService _notifications;

//         public InvoiceService(ApplicationDbContext context, INotificationService notifications)
//         {
//             _context = context;
//             _notifications = notifications;
//         }

//         public async Task<List<PendingAppointmentBillingDto>> GetPendingBillingsAsync(string stage)
// {
//     var result = new List<PendingAppointmentBillingDto>();

//     if (stage == "Pending")
//     {
//         // 1. Lấy danh sách ID Appointment đã xuất hóa đơn
//         var paidAppointmentIds = await _context.InvoiceDetails
//             .Where(d => d.SourceType == "Appointment")
//             .Select(d => d.SourceId)
//             .Distinct()
//             .ToListAsync();

//         // 2. Lọc danh sách Appointment chưa thanh toán trực tiếp từ Database
//         var pendingAppointments = await _context.Set<Appointment>()
//             .Where(a => !paidAppointmentIds.Contains(a.AppointmentId))
//             .ToListAsync();

//         foreach (var app in pendingAppointments)
//         {
//             result.Add(new PendingAppointmentBillingDto
//             {
//                 AppointmentId = app.AppointmentId,
//                 PatientId = app.PatientId ?? 0,
//                 BillingStage = "Pending",
//                 Items = new List<PendingBillingItemDto>
//                 {
//                     new PendingBillingItemDto
//                     {
//                         SourceType = "Appointment",
//                         SourceId = app.AppointmentId,
//                         ItemName = "Phí khám ban đầu",
//                         UnitPrice = 150000,
//                         Quantity = 1,
//                         TotalPrice = 150000
//                     }
//                 }
//             });
//         }
//     }
//     else if (stage == "LabAndConsultation")
//     {
//         // 1. Lấy danh sách ID LabTest đã xuất hóa đơn
//         var paidLabTestIds = await _context.InvoiceDetails
//             .Where(d => d.SourceType == "LabTest")
//             .Select(d => d.SourceId)
//             .Distinct()
//             .ToListAsync();

//         // 2. Lọc các LabTest chưa thanh toán trực tiếp từ Database
//         var pendingLabTests = await _context.LabTests
//             .Include(l => l.LabTestType)
//             .Where(l => !paidLabTestIds.Contains(l.Id))
//             .ToListAsync();

//         var groupedByPatient = pendingLabTests.GroupBy(l => l.PatientId);

//         foreach (var group in groupedByPatient)
//         {
//             var items = group.Select(l => new PendingBillingItemDto
//             {
//                 SourceType = "LabTest",
//                 SourceId = l.Id,
//                 ItemName = l.LabTestType?.Name ?? "Xét nghiệm",
//                 UnitPrice = l.LabTestType?.Price ?? 0,
//                 Quantity = 1,
//                 TotalPrice = l.LabTestType?.Price ?? 0
//             }).ToList();

//             result.Add(new PendingAppointmentBillingDto
//             {
//                 AppointmentId = 0, // Gom nhóm theo PatientId
//                 PatientId = group.Key,
//                 BillingStage = "LabAndConsultation",
//                 Items = items
//             });
//         }
//     }

//     return result;
// }

//         public async Task<InvoiceResponseDto> CreateInvoiceAsync(int cashierId, CreateInvoiceDto dto)
//         {
//             await using var transaction = dto.BillingStage == "Book"
//                 ? await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable) : null;
//             // Kiểm tra chống thu trùng (Duplicate Check via SourceType + SourceId)
=======

//         public InvoiceService(ApplicationDbContext context)
//         {
//             _context = context;
//         }

//         public async Task<List<PendingAppointmentBillingDto>> GetPendingBillingsAsync(string stage)
//         {
//             var result = new List<PendingAppointmentBillingDto>();

//             if (stage == "Pending")
//             {
//                 var paidAppointmentIds = await _context.InvoiceDetails
//                     .Where(d => d.SourceType == "Appointment")
//                     .Select(d => d.SourceId)
//                     .Distinct()
//                     .ToListAsync();

//                 var pendingAppointments = await _context.Appointments
//                     .Where(a => !paidAppointmentIds.Contains(a.AppointmentId))
//                     .ToListAsync();

//                 foreach (var app in pendingAppointments)
//                 {
//                     decimal examinationFee = 150000;
//                     result.Add(new PendingAppointmentBillingDto
//                     {
//                         AppointmentId = app.AppointmentId,
//                         PatientId = app.PatientId ?? 0,
//                         BillingStage = "Pending",
//                         Items = new List<PendingBillingItemDto>
//                         {
//                             new PendingBillingItemDto
//                             {
//                                 SourceType = "Appointment",
//                                 SourceId = app.AppointmentId,
//                                 ItemName = "Phí khám ban đầu",
//                                 UnitPrice = examinationFee,
//                                 Quantity = 1,
//                                 TotalPrice = examinationFee
//                             }
//                         }
//                     });
//                 }
//             }
//             else if (stage == "LabAndConsultation")
//             {
//                 var paidLabTestIds = await _context.InvoiceDetails
//                     .Where(d => d.SourceType == "LabTest")
//                     .Select(d => d.SourceId)
//                     .Distinct()
//                     .ToListAsync();

//                 var pendingLabTests = await _context.LabTests
//                     .Include(l => l.LabTestType)
//                     .Where(l => l.Status == "Completed" && !paidLabTestIds.Contains(l.Id))
//                     .ToListAsync();

//                 var groupedByPatient = pendingLabTests.GroupBy(l => l.PatientId);

//                 foreach (var group in groupedByPatient)
//                 {
//                     var items = group.Select(l => new PendingBillingItemDto
//                     {
//                         SourceType = "LabTest",
//                         SourceId = l.Id,
//                         ItemName = l.LabTestType?.Name ?? "Xét nghiệm",
//                         UnitPrice = l.LabTestType?.Price ?? 0,
//                         Quantity = 1,
//                         TotalPrice = l.LabTestType?.Price ?? 0
//                     }).ToList();

//                     result.Add(new PendingAppointmentBillingDto
//                     {
//                         AppointmentId = 0,
//                         PatientId = group.Key,
//                         BillingStage = "LabAndConsultation",
//                         Items = items
//                     });
//                 }
//             }

//             return result;
//         }

//         public async Task<InvoiceResponseDto> CreateInvoiceAsync(int cashierId, CreateInvoiceDto dto)
//         {
//             // Kiểm tra chống thu trùng
>>>>>>> main
//             foreach (var item in dto.Items)
//             {
//                 bool isAlreadyPaid = await _context.InvoiceDetails
//                     .AnyAsync(d => d.SourceType == item.SourceType && d.SourceId == item.SourceId);
<<<<<<< HEAD

=======
>>>>>>> main
//                 if (isAlreadyPaid)
//                 {
//                     throw new InvalidOperationException($"Khoản phí '{item.ItemName}' (Mã: {item.SourceId}) đã được thanh toán trước đó!");
//                 }
//             }

<<<<<<< HEAD
//             // A Book source can reference the reception invoice that unlocks issuing/reissuing the book.
//             var bookSources = dto.Items.Where(x => x.SourceType == "Book").Select(x => x.SourceId).Distinct().ToArray();
//             var bookInvoices = dto.BillingStage == "Book"
//                 ? await _context.BookInvoices.Where(x => bookSources.Contains(x.BookInvoiceId)).ToListAsync()
//                 : new List<BookInvoice>();
//             foreach (var bookInvoice in bookInvoices)
//             {
//                 if (bookInvoice.PatientId != dto.PatientId || bookInvoice.Status != "Unpaid")
//                     throw new InvalidOperationException("Hóa đơn sổ không thuộc bệnh nhân hoặc đã được thanh toán.");
//                 var sourceItems = dto.Items.Where(x => x.SourceType == "Book" && x.SourceId == bookInvoice.BookInvoiceId).ToList();
//                 if (sourceItems.Count != 1 || sourceItems[0].Quantity != 1 || sourceItems[0].UnitPrice != bookInvoice.Amount)
//                     throw new InvalidOperationException("Số tiền thanh toán phải khớp phí trên hóa đơn sổ.");
//                 bookInvoice.Status = "Paid";
//                 bookInvoice.PaidAt = DateTime.UtcNow;
//             }

//             var invoice = new Invoice
//             {
//                 AppointmentId = dto.AppointmentId,
=======
//             // Tính toán giá trị tiền
//             decimal rawTotalAmount = dto.Items.Sum(x => x.UnitPrice * x.Quantity);
//             decimal discountPercent = Math.Clamp(dto.InsuranceDiscountPercent, 0, 100);
//             decimal insuranceAmount = Math.Round((rawTotalAmount * discountPercent) / 100);
//             decimal patientAmount = rawTotalAmount - insuranceAmount;

//             var invoice = new Invoice
//             {
//                 AppointmentId = (dto.AppointmentId.HasValue && dto.AppointmentId.Value > 0) ? dto.AppointmentId.Value : null,
>>>>>>> main
//                 PatientId = dto.PatientId,
//                 CashierId = cashierId,
//                 BillingStage = dto.BillingStage,
//                 PaymentMethod = dto.PaymentMethod,
//                 Status = "Paid",
//                 CreatedAt = DateTime.UtcNow,
<<<<<<< HEAD
//                 TotalAmount = dto.Items.Sum(x => x.UnitPrice * x.Quantity)
=======
//                 TotalAmount = rawTotalAmount,
//                 InsuranceDiscountPercent = discountPercent,
//                 InsuranceAmount = insuranceAmount,
//                 PatientAmount = patientAmount
>>>>>>> main
//             };

//             foreach (var item in dto.Items)
//             {
//                 invoice.InvoiceDetails.Add(new InvoiceDetail
//                 {
//                     SourceType = item.SourceType,
//                     SourceId = item.SourceId,
//                     ItemName = item.ItemName,
//                     UnitPrice = item.UnitPrice,
//                     Quantity = item.Quantity,
//                     TotalPrice = item.UnitPrice * item.Quantity
//                 });
//             }

//             _context.Invoices.Add(invoice);
//             await _context.SaveChangesAsync();

<<<<<<< HEAD
//             if (invoice.BillingStage == "Book" && invoice.Status == "Paid")
//             {
//                 var rows = await _notifications.StageAsync(await _notifications.ReceptionRecipientsAsync(),
//                     $"invoice:{invoice.Id}:book-paid", "Billing", "Tiền sổ đã thanh toán",
//                     $"Hóa đơn Book #{invoice.Id} đã thanh toán. Lễ tân có thể xử lý cấp sổ.");
//                 await _context.SaveChangesAsync();
//                 await transaction!.CommitAsync();
//                 await _notifications.PublishAsync(rows);
//                 foreach (var bookInvoice in bookInvoices)
//                     await _notifications.PublishBookInvoiceChangedAsync(bookInvoice);
//                 if (bookInvoices.Count == 0) await _notifications.PublishBookPaymentAsync(invoice);
//             }

=======
>>>>>>> main
//             return (await GetInvoiceByIdAsync(invoice.Id))!;
//         }

//         public async Task<InvoiceResponseDto?> GetInvoiceByIdAsync(int id)
//         {
//             var inv = await _context.Invoices
//                 .Include(i => i.InvoiceDetails)
//                 .FirstOrDefaultAsync(i => i.Id == id);

//             if (inv == null) return null;

//             return new InvoiceResponseDto
//             {
//                 Id = inv.Id,
<<<<<<< HEAD
//                AppointmentId = inv.AppointmentId ?? 0,
=======
//                 AppointmentId = inv.AppointmentId,
>>>>>>> main
//                 PatientId = inv.PatientId,
//                 CashierId = inv.CashierId,
//                 BillingStage = inv.BillingStage,
//                 TotalAmount = inv.TotalAmount,
<<<<<<< HEAD
=======
//                 InsuranceDiscountPercent = inv.InsuranceDiscountPercent,
//                 InsuranceAmount = inv.InsuranceAmount,
//                 PatientAmount = inv.PatientAmount,
>>>>>>> main
//                 PaymentMethod = inv.PaymentMethod,
//                 Status = inv.Status,
//                 CreatedAt = inv.CreatedAt,
//                 Details = inv.InvoiceDetails.Select(d => new InvoiceDetailResponseDto
//                 {
<<<<<<< HEAD
//                     Id = d.Id, // Sửa lại thành d.Id
=======
//                     Id = d.Id,
>>>>>>> main
//                     SourceType = d.SourceType,
//                     SourceId = d.SourceId,
//                     ItemName = d.ItemName,
//                     UnitPrice = d.UnitPrice,
//                     Quantity = d.Quantity,
//                     TotalPrice = d.TotalPrice
//                 }).ToList()
//             };
//         }
//     }
// }

<<<<<<< HEAD

=======
>>>>>>> main
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

        public InvoiceService(
            ApplicationDbContext context,
            INotificationService notifications)
        {
            _context = context;
            _notifications = notifications;
        }

<<<<<<< HEAD
        public async Task<List<PendingAppointmentBillingDto>>
            GetPendingBillingsAsync(string stage)
=======
        public async Task<List<PendingAppointmentBillingDto>> GetPendingBillingsAsync(string stage)
>>>>>>> main
        {
            var result = new List<PendingAppointmentBillingDto>();

            if (stage == "Pending")
            {
                var paidAppointmentIds = await _context.InvoiceDetails
                    .Where(d => d.SourceType == "Appointment")
                    .Select(d => d.SourceId)
                    .Distinct()
                    .ToListAsync();

<<<<<<< HEAD
                var pendingAppointments = await _context.Set<Appointment>()
=======
                var pendingAppointments = await _context.Appointments
>>>>>>> main
                    .Where(a => !paidAppointmentIds.Contains(a.AppointmentId))
                    .ToListAsync();

                foreach (var app in pendingAppointments)
                {
<<<<<<< HEAD
=======
                    decimal examinationFee = 150000;
>>>>>>> main
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
<<<<<<< HEAD
                                UnitPrice = 150000,
                                Quantity = 1,
                                TotalPrice = 150000
=======
                                UnitPrice = examinationFee,
                                Quantity = 1,
                                TotalPrice = examinationFee
>>>>>>> main
                            }
                        }
                    });
                }
            }
            else if (stage == "LabAndConsultation")
            {
<<<<<<< HEAD
=======
                // 1. Lấy danh sách LabTest.Id đã được xuất hóa đơn "LabTest"
>>>>>>> main
                var paidLabTestIds = await _context.InvoiceDetails
                    .Where(d => d.SourceType == "LabTest")
                    .Select(d => d.SourceId)
                    .Distinct()
                    .ToListAsync();

<<<<<<< HEAD
                var pendingLabTests = await _context.LabTests
                    .Include(l => l.LabTestType)
                    .Where(l => !paidLabTestIds.Contains(l.Id))
                    .ToListAsync();

                var groupedByPatient = pendingLabTests
                    .GroupBy(l => l.PatientId);

                foreach (var group in groupedByPatient)
=======
                // 2. Lấy các LabTest đang ở trạng thái "Pending" VÀ CHƯA thanh toán
                var pendingLabTests = await _context.LabTests
                    .Include(l => l.LabTestType)
                    .Where(l => l.Status == "Pending" && !paidLabTestIds.Contains(l.Id))
                    .ToListAsync();

                // 3. Gom nhóm theo PatientId
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
            await using var transaction = dto.BillingStage == "Book"
                ? await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable) : null;
            // Kiểm tra chống thu trùng
            foreach (var item in dto.Items)
            {
                bool isAlreadyPaid = await _context.InvoiceDetails
                    .AnyAsync(d => d.SourceType == item.SourceType && d.SourceId == item.SourceId);
                if (isAlreadyPaid)
>>>>>>> main
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
                        AppointmentId = 0,
                        PatientId = group.Key,
                        BillingStage = "LabAndConsultation",
                        Items = items
                    });
                }
            }

<<<<<<< HEAD
            return result;
        }

        public async Task<InvoiceResponseDto> CreateInvoiceAsync(
            int cashierId,
            CreateInvoiceDto dto)
        {
            await using var transaction = dto.BillingStage == "Book"
                ? await _context.Database.BeginTransactionAsync(
                    System.Data.IsolationLevel.Serializable)
                : null;

            foreach (var item in dto.Items)
            {
                bool isAlreadyPaid = await _context.InvoiceDetails
                    .AnyAsync(d =>
                        d.SourceType == item.SourceType &&
                        d.SourceId == item.SourceId);

                if (isAlreadyPaid)
                {
                    throw new InvalidOperationException(
                        $"Khoản phí '{item.ItemName}' (Mã: {item.SourceId}) " +
                        "đã được thanh toán trước đó!");
                }
            }

            var bookSources = dto.Items
                .Where(x => x.SourceType == "Book")
                .Select(x => x.SourceId)
                .Distinct()
                .ToArray();

=======
            // Keep the reception book invoice and cashier payment in the same transaction.
            var bookSources = dto.Items.Where(x => x.SourceType == "Book").Select(x => x.SourceId).Distinct().ToArray();
>>>>>>> main
            var bookInvoices = dto.BillingStage == "Book"
                ? await _context.BookInvoices
                    .Where(x => bookSources.Contains(x.BookInvoiceId))
                    .ToListAsync()
                : new List<BookInvoice>();

            foreach (var bookInvoice in bookInvoices)
            {
                if (bookInvoice.PatientId != dto.PatientId ||
                    bookInvoice.Status != "Unpaid")
                {
                    throw new InvalidOperationException(
                        "Hóa đơn sổ không thuộc bệnh nhân hoặc đã được thanh toán.");
                }

                var sourceItems = dto.Items
                    .Where(x =>
                        x.SourceType == "Book" &&
                        x.SourceId == bookInvoice.BookInvoiceId)
                    .ToList();

                if (sourceItems.Count != 1 ||
                    sourceItems[0].Quantity != 1 ||
                    sourceItems[0].UnitPrice != bookInvoice.Amount)
                {
                    throw new InvalidOperationException(
                        "Số tiền thanh toán phải khớp phí trên hóa đơn sổ.");
                }

                bookInvoice.Status = "Paid";
                bookInvoice.PaidAt = DateTime.UtcNow;
            }

            // Tính toán giá trị tiền
            decimal rawTotalAmount = dto.Items.Sum(x => x.UnitPrice * x.Quantity);
            decimal discountPercent = Math.Clamp(dto.InsuranceDiscountPercent, 0, 100);
            decimal insuranceAmount = Math.Round((rawTotalAmount * discountPercent) / 100);
            decimal patientAmount = rawTotalAmount - insuranceAmount;

            var invoice = new Invoice
            {
                AppointmentId = (dto.AppointmentId.HasValue && dto.AppointmentId.Value > 0) ? dto.AppointmentId.Value : null,
                PatientId = dto.PatientId,
                CashierId = cashierId,
                BillingStage = dto.BillingStage,
                PaymentMethod = dto.PaymentMethod,
                Status = "Paid",
                CreatedAt = DateTime.UtcNow,
<<<<<<< HEAD
                TotalAmount = dto.Items.Sum(
                    x => x.UnitPrice * x.Quantity)
=======
                TotalAmount = rawTotalAmount,
                InsuranceDiscountPercent = discountPercent,
                InsuranceAmount = insuranceAmount,
                PatientAmount = patientAmount
>>>>>>> main
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

            if (invoice.BillingStage == "Book" &&
                invoice.Status == "Paid")
            {
                var rows = await _notifications.StageAsync(
                    await _notifications.ReceptionRecipientsAsync(),
                    $"invoice:{invoice.Id}:book-paid",
                    "Billing",
                    "Tiền sổ đã thanh toán",
                    $"Hóa đơn Book #{invoice.Id} đã thanh toán. " +
                    "Lễ tân có thể xử lý cấp sổ.");

                await _context.SaveChangesAsync();
                await transaction!.CommitAsync();

                await _notifications.PublishAsync(rows);

                foreach (var bookInvoice in bookInvoices)
                {
                    await _notifications.PublishBookInvoiceChangedAsync(
                        bookInvoice);
                }

                if (bookInvoices.Count == 0)
                {
                    await _notifications.PublishBookPaymentAsync(invoice);
                }
            }

            return (await GetInvoiceByIdAsync(invoice.Id))!;
        }

        public async Task<InvoiceResponseDto?> GetInvoiceByIdAsync(int id)
        {
            var inv = await _context.Invoices
                .AsNoTracking()
                .Include(i => i.InvoiceDetails)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (inv == null)
            {
                return null;
            }

            return MapInvoice(inv);
        }

        public async Task<IEnumerable<InvoiceResponseDto>>
            GetInvoiceHistoryAsync(string? searchKeyword)
        {
            var query = _context.Invoices
                .AsNoTracking()
                .Include(i => i.InvoiceDetails)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchKeyword))
            {
                var keyword = searchKeyword.Trim();

                query = query.Where(i =>
                    i.InvoiceDetails.Any(d =>
                        d.ItemName.Contains(keyword) ||
                        d.SourceType.Contains(keyword)) ||
                    i.Status.Contains(keyword) ||
                    i.BillingStage.Contains(keyword) ||
                    i.PaymentMethod.Contains(keyword));
                
                if (int.TryParse(keyword, out var id))
                {
                    query = _context.Invoices
                        .AsNoTracking()
                        .Include(i => i.InvoiceDetails)
                        .Where(i =>
                            i.Id == id ||
                            i.PatientId == id ||
                            (i.AppointmentId.HasValue &&
                             i.AppointmentId.Value == id) ||
                            i.InvoiceDetails.Any(d =>
                                d.ItemName.Contains(keyword) ||
                                d.SourceType.Contains(keyword)) ||
                            i.Status.Contains(keyword) ||
                            i.BillingStage.Contains(keyword) ||
                            i.PaymentMethod.Contains(keyword));
                }
            }

            var invoices = await query
                .OrderByDescending(i => i.CreatedAt)
                .ThenByDescending(i => i.Id)
                .ToListAsync();

            return invoices.Select(MapInvoice).ToList();
        }

        public async Task<InvoiceResponseDto> CreateAdjustmentInvoiceAsync(
            int cashierId,
            CreateAdjustmentInvoiceDto dto)
        {
            if (dto.OriginalInvoiceId <= 0)
            {
                throw new InvalidOperationException(
                    "Mã hóa đơn gốc không hợp lệ.");
            }

            if (string.IsNullOrWhiteSpace(dto.Reason))
            {
                throw new InvalidOperationException(
                    "Vui lòng nhập lý do điều chỉnh hóa đơn.");
            }

            if (dto.Items == null || dto.Items.Count == 0)
            {
                throw new InvalidOperationException(
                    "Hóa đơn điều chỉnh phải có ít nhất một khoản mục.");
            }

            // Tổng tiền điều chỉnh phải khớp với các khoản mục.
            var itemsTotal = dto.Items.Sum(
                x => x.UnitPrice * x.Quantity);

            if (itemsTotal != dto.AdjustmentTotalAmount)
            {
                throw new InvalidOperationException(
                    "Tổng tiền điều chỉnh không khớp tổng các khoản mục.");
            }

            if (dto.AdjustmentTotalAmount !=
                dto.AdjustmentInsuranceAmount +
                dto.AdjustmentPatientAmount)
            {
                throw new InvalidOperationException(
                    "Tổng tiền điều chỉnh phải bằng tiền bảo hiểm " +
                    "cộng tiền điều chỉnh của bệnh nhân.");
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    System.Data.IsolationLevel.Serializable);

            var originalInvoice = await _context.Invoices
                .Include(i => i.InvoiceDetails)
                .FirstOrDefaultAsync(
                    i => i.Id == dto.OriginalInvoiceId);

            if (originalInvoice == null)
            {
                throw new InvalidOperationException(
                    "Không tìm thấy hóa đơn gốc.");
            }

            if (originalInvoice.InvoiceType == "Adjustment")
            {
                throw new InvalidOperationException(
                    "Không thể tạo chứng từ điều chỉnh từ một hóa đơn điều chỉnh.");
            }

            var adjustmentInvoice = new Invoice
            {
                AppointmentId = originalInvoice.AppointmentId,
                PatientId = originalInvoice.PatientId,
                CashierId = cashierId,
                BillingStage = originalInvoice.BillingStage,
                InvoiceType = "Adjustment",
                OriginalInvoiceId = originalInvoice.Id,
                PaymentMethod = dto.PaymentMethod,
                Status = "Paid",
                CreatedAt = DateTime.UtcNow,
                TotalAmount = dto.AdjustmentTotalAmount,
                InsuranceAmount = dto.AdjustmentInsuranceAmount,
                PatientAmount = dto.AdjustmentPatientAmount
            };

            foreach (var item in dto.Items)
            {
                adjustmentInvoice.InvoiceDetails.Add(
                    new InvoiceDetail
                    {
                        SourceType = item.SourceType,
                        SourceId = item.SourceId,
                        ItemName = item.ItemName,
                        UnitPrice = item.UnitPrice,
                        Quantity = item.Quantity,
                        TotalPrice = item.UnitPrice * item.Quantity
                    });
            }

            // Lưu lý do trong một dòng chi tiết không tính tiền,
            // do entity Invoice hiện chưa có trường AdjustmentReason.
            adjustmentInvoice.InvoiceDetails.Add(
                new InvoiceDetail
                {
                    SourceType = "AdjustmentReason",
                    SourceId = originalInvoice.Id,
                    ItemName = $"Lý do điều chỉnh: {dto.Reason.Trim()}",
                    UnitPrice = 0,
                    Quantity = 1,
                    TotalPrice = 0
                });

            _context.Invoices.Add(adjustmentInvoice);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return (await GetInvoiceByIdAsync(adjustmentInvoice.Id))!;
        }

        private static InvoiceResponseDto MapInvoice(Invoice inv)
        {
            return new InvoiceResponseDto
            {
                Id = inv.Id,
                AppointmentId = inv.AppointmentId ?? 0,
                PatientId = inv.PatientId,
                CashierId = inv.CashierId,
                BillingStage = inv.BillingStage,
                TotalAmount = inv.TotalAmount,
                InsuranceDiscountPercent = inv.InsuranceDiscountPercent,
                InsuranceAmount = inv.InsuranceAmount,
                PatientAmount = inv.PatientAmount,
                PaymentMethod = inv.PaymentMethod,
                Status = inv.Status,
                CreatedAt = inv.CreatedAt,
<<<<<<< HEAD
                Details = inv.InvoiceDetails.Select(d =>
                    new InvoiceDetailResponseDto
                    {
                        Id = d.Id,
                        SourceType = d.SourceType,
                        SourceId = d.SourceId,
                        ItemName = d.ItemName,
                        UnitPrice = d.UnitPrice,
                        Quantity = d.Quantity,
                        TotalPrice = d.TotalPrice
                    }).ToList()
=======
                Details = inv.InvoiceDetails.Select(d => new InvoiceDetailResponseDto
                {
                    Id = d.Id,
                    SourceType = d.SourceType,
                    SourceId = d.SourceId,
                    ItemName = d.ItemName,
                    UnitPrice = d.UnitPrice,
                    Quantity = d.Quantity,
                    TotalPrice = d.TotalPrice
                }).ToList()
>>>>>>> main
            };
        }
    }
}


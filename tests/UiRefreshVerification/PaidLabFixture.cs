using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;

internal static class PaidLabFixture
{
    // Notification/UI fixtures start after payment. Payment guards are exercised by --post-merge.
    internal static async Task AddAsync(ApplicationDbContext db, int labTestId)
    {
        var test = await db.LabTests.AsNoTracking().Include(t => t.LabTestType).SingleAsync(t => t.Id == labTestId);
        var price = test.LabTestType!.Price;
        var cashier = await db.Users.Where(u => u.Role.RoleName == "Admin").Select(u => u.UserId).FirstAsync();
        db.Invoices.Add(new Invoice
        {
            PatientId = test.PatientId, AppointmentId = test.AppointmentId, CashierId = cashier,
            BillingStage = "LabAndConsultation", InvoiceType = "Standard", Status = "Paid",
            TotalAmount = price, PatientAmount = price, PaidAmount = price, PaymentMethod = "Cash", CreatedAt = DateTime.UtcNow,
            InvoiceDetails = [new InvoiceDetail { SourceType = "LabTest", SourceId = test.Id,
                ItemName = test.LabTestType.Name, UnitPrice = price, Quantity = 1, TotalPrice = price }],
            Payments = [new InvoicePayment { ReceiptNumber = "FIXTURE-" + Guid.NewGuid().ToString("N"),
                PaymentType = "Payment", Amount = price, PaymentMethod = "Cash", CashierId = cashier, PaidAt = DateTime.UtcNow }]
        });
        await db.SaveChangesAsync();
    }
}

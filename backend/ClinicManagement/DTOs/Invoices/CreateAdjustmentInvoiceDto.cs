using System.Collections.Generic;

namespace ClinicManagement.DTOs.Invoices
{
    public class CreateAdjustmentInvoiceDto
    {
        public int OriginalInvoiceId { get; set; }
        public int? PrescriptionStockReviewId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = "Cash";
        public string? ReferenceCode { get; set; }

        // Số tiền điều chỉnh (Dương nếu thu thêm, Âm nếu hoàn lại cho bệnh nhân)
        public decimal AdjustmentTotalAmount { get; set; }
        public decimal AdjustmentInsuranceAmount { get; set; } = 0;
        public decimal AdjustmentPatientAmount { get; set; }

        public List<CreateInvoiceItemDto> Items { get; set; } = new();
    }
}
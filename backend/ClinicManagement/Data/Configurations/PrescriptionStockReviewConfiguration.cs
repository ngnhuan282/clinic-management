using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ClinicManagement.Data.Configurations;

public class PrescriptionStockReviewConfiguration : IEntityTypeConfiguration<PrescriptionStockReview>
{
    public void Configure(EntityTypeBuilder<PrescriptionStockReview> builder)
    {
        builder.HasKey(x => x.PrescriptionStockReviewId);
        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Note).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.PaymentStatus).HasMaxLength(20).IsRequired();
        builder.Property(x => x.UpdatedAt).IsConcurrencyToken();
        builder.HasIndex(x => x.PrescriptionId).IsUnique().HasFilter("[Status] = 'Pending'");
        builder.HasOne(x => x.Prescription).WithMany(x => x.StockReviews)
            .HasForeignKey(x => x.PrescriptionId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ResolvedByUser).WithMany().HasForeignKey(x => x.ResolvedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Invoice>().WithMany().HasForeignKey(x => x.InvoiceId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
